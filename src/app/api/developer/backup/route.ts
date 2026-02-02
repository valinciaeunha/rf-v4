import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/actions/auth"
import { exec } from "child_process"
import { promisify } from "util"
import { logger } from "@/lib/logger"

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for large databases

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
        database: match[5].split('?')[0], // Remove query params if any
    }
}

export async function GET(request: NextRequest) {
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

        const dbConfig = parseDatabaseUrl(databaseUrl)

        // Set PGPASSWORD environment variable for pg_dump
        const env = {
            ...process.env,
            PGPASSWORD: dbConfig.password,
        }

        // Build pg_dump command
        // --no-owner: Don't output ownership commands
        // --no-privileges: Don't output privilege (grant/revoke) commands
        // --clean: Output commands to DROP before creating
        // --if-exists: Use IF EXISTS when dropping objects
        // --if-exists: Use IF EXISTS when dropping objects
        // Strategy 1: Try local pg_dump (Production/Server with pg-client)
        let command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --no-owner --no-privileges --clean --if-exists`

        // Strategy 2: If running on Dev machine with Docker but no local pg_dump, try docker exec
        // Note: This matches the container_name in docker-compose.yml
        const dockerStrategy = `docker exec redfinger-postgres pg_dump -U postgres ${dbConfig.database} --no-owner --no-privileges --clean --if-exists`

        let stdout, stderr;

        try {
            const result = await execAsync(command, {
                env,
                maxBuffer: 100 * 1024 * 1024,
            })
            stdout = result.stdout;
        } catch (localError: any) {
            // Improved Fallback Logic
            const isDev = dbConfig.host === '127.0.0.1' || dbConfig.host === 'localhost';

            // If local pg_dump failed AND we are on localhost, try Docker fallback
            if (isDev) {
                logger.warn("Local pg_dump failed/not found, attempting Docker exec fallback...", { error: localError.message });
                try {
                    const result = await execAsync(dockerStrategy, {
                        maxBuffer: 100 * 1024 * 1024
                    });
                    stdout = result.stdout;
                } catch (dockerError) {
                    logger.error("Docker fallback also failed. Please install PostgreSQL Client tools or ensure Docker is running.");
                    throw localError; // Throw original error to be handled by outer catch
                }
            } else {
                throw localError;
            }
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `redfinger_backup_${timestamp}.sql`

        // Return as downloadable SQL file
        return new NextResponse(stdout, {
            status: 200,
            headers: {
                'Content-Type': 'application/sql',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })

    } catch (error: any) {
        console.error("[Backup] pg_dump failed:", error)

        // Check if pg_dump is not available
        if (error.message?.includes('pg_dump') || error.code === 'ENOENT') {
            return NextResponse.json(
                {
                    error: "pg_dump not available",
                    message: "The pg_dump utility is not installed on the server. Please use the JSON export option or install PostgreSQL client tools.",
                    fallback: "json"
                },
                { status: 501 }
            )
        }

        return NextResponse.json(
            { error: "Backup failed", message: error.message },
            { status: 500 }
        )
    }
}
