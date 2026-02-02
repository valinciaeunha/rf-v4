import { db } from "@/lib/db"
import { auditLogs } from "@/lib/db/schema"
import { headers } from "next/headers"

export interface AuditLogParams {
    action: string
    targetType: string
    targetId?: number | null
    performedBy: number
    changes?: object | null
}

/**
 * Log an admin action for audit trail
 */
export async function logAudit(params: AuditLogParams) {
    "use server"

    try {
        // Get IP address from headers
        const headersList = await headers()
        const forwardedFor = headersList.get("x-forwarded-for")
        const realIp = headersList.get("x-real-ip")
        const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown"

        await db.insert(auditLogs).values({
            action: params.action,
            targetType: params.targetType,
            targetId: params.targetId || null,
            performedBy: params.performedBy,
            changes: params.changes ? JSON.stringify(params.changes) : null,
            ipAddress,
        })
    } catch (error) {
        // Don't throw - audit logging failure shouldn't break main operations
        console.error("Audit log failed:", error)
    }
}

/**
 * Create a diff object showing what changed
 */
export function createChangeDiff(
    before: Record<string, unknown>,
    after: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
    const diff: Record<string, { from: unknown; to: unknown }> = {}

    for (const key of Object.keys(after)) {
        if (before[key] !== after[key]) {
            diff[key] = {
                from: before[key],
                to: after[key],
            }
        }
    }

    return diff
}
