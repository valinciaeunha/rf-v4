import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/actions/auth"
import { spawn } from "child_process"
import { writeFile, unlink } from "fs/promises"
import { createReadStream } from "fs"
import { logger } from "@/lib/logger"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Allow up to 120 seconds for restore

// Parse DATABASE_URL into components
function parseDatabaseUrl(url: string) {
    const regex = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/
    const match = url.match(regex)

    if (!match) {
        throw new Error("Invalid DATABASE_URL format")
    }

    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5].split('?')[0],
    }
}

export async function POST(request: NextRequest) {
    let tempFilePath: string | null = null

    try {
        // Verify developer access
        const session = await getSessionUser()
        if (!session || session.role !== "developer") {
            return NextResponse.json(
                { error: "Unauthorized - Developer access required" },
                { status: 403 }
            )
        }

        const databaseUrl = process.env.DATABASE_URL
        if (!databaseUrl) {
            return NextResponse.json(
                { error: "DATABASE_URL not configured" },
                { status: 500 }
            )
        }

        // Get the uploaded file
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const confirmPhrase = formData.get('confirmPhrase') as string | null

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.name.endsWith('.sql')) {
            return NextResponse.json(
                { error: "Invalid file type. Only .sql files are accepted." },
                { status: 400 }
            )
        }

        // Validate confirmation phrase
        if (confirmPhrase !== "RESTORE DATABASE") {
            return NextResponse.json(
                { error: "Invalid confirmation phrase. Type 'RESTORE DATABASE' to confirm." },
                { status: 400 }
            )
        }

        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 100MB." },
                { status: 400 }
            )
        }

        const dbConfig = parseDatabaseUrl(databaseUrl)

        // Write file to temp directory
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        tempFilePath = join(tmpdir(), `restore_${randomUUID()}.sql`)
        await writeFile(tempFilePath, fileBuffer)

        // Set PGPASSWORD environment variable
        const env = {
            ...process.env,
            PGPASSWORD: dbConfig.password,
        }

        // SECURITY: Validate DB config values don't contain shell metacharacters
        const validateSafe = (value: string, name: string) => {
            if (/[;&|`$(){}[\]<>\\]/.test(value)) {
                throw new Error(`Invalid ${name} in DATABASE_URL`);
            }
        };
        validateSafe(dbConfig.host, 'host');
        validateSafe(dbConfig.port, 'port');
        validateSafe(dbConfig.user, 'user');
        validateSafe(dbConfig.database, 'database');

        // SECURITY: Use spawn with array arguments instead of shell string
        // This prevents command injection via malformed inputs
        // const { spawn } = require('child_process') as typeof import('child_process'); -> Moved to top-level import

        // Helper function for restore strategy
        const performRestore = (useDocker: boolean) => new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
            let cmd = 'psql';
            let args = [
                '-h', dbConfig.host,
                '-p', dbConfig.port,
                '-U', dbConfig.user,
                '-d', dbConfig.database,
                '-1',
                '-v', 'ON_ERROR_STOP=1'
            ];

            if (useDocker) {
                cmd = 'docker';
                // docker exec -i redfinger-postgres psql -U postgres ...
                args = ['exec', '-i', 'redfinger-postgres', 'psql', '-U', 'postgres', '-d', dbConfig.database, '-v', 'ON_ERROR_STOP=1'];
            } else {
                args.push('-f', tempFilePath!);
            }

            const child = spawn(cmd, args, {
                env: env as NodeJS.ProcessEnv
            });

            // If docker, pipe the file content to stdin
            if (useDocker) {
                const fileStream = createReadStream(tempFilePath!);
                fileStream.pipe(child.stdin);
                fileStream.on('error', (e) => child.kill());
            }

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
            child.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });

            child.on('close', (code: number | null) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(stderr || `${cmd} exited with code ${code}`));
                }
            });

            child.on('error', (err) => {
                reject(err);
            });
        });

        // Execute Restore with Fallback
        try {
            await performRestore(false);
        } catch (localError: any) {
            const isDev = dbConfig.host === '127.0.0.1' || dbConfig.host === 'localhost';

            if (isDev && (localError.code === 'ENOENT' || localError.message?.includes('psql'))) {
                logger.warn("Local psql not found, attempting Docker exec restore...", { error: localError.message });
                await performRestore(true);
            } else {
                throw localError;
            }
        }

        // Clean up temp file
        if (tempFilePath) {
            await unlink(tempFilePath).catch(() => { })
        }

        return NextResponse.json({
            success: true,
            message: "Database restored successfully",
            details: {
                file: file.name,
                size: file.size,
                restoredBy: session.email,
                timestamp: new Date().toISOString(),
            }
        })

    } catch (error: unknown) {
        console.error("[Restore] Failed:", error)

        // Clean up temp file on error
        if (tempFilePath) {
            await unlink(tempFilePath).catch(() => { })
        }

        // Type safe error handling
        const err = error as any; // Temporary cast for legacy code patterns
        const errorMessage = err?.message || "Unknown error";
        const errorCode = err?.code || "";
        const errorStderr = err?.stderr || "";

        // Check if psql is not available
        if (errorMessage.includes('psql') || errorCode === 'ENOENT') {
            return NextResponse.json(
                {
                    error: "psql not available",
                    message: "The psql utility is not installed on the server.",
                },
                { status: 501 }
            )
        }

        // Check for SQL errors
        if (errorStderr) {
            return NextResponse.json(
                {
                    error: "Restore failed",
                    message: errorStderr.slice(0, 500), // Limit error message length
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: "Restore failed", message: errorMessage },
            { status: 500 }
        )
    }
}
