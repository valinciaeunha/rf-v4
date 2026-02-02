"use server"

import { db } from "@/lib/db"
import { auditLogs, users, products, productSpecifications, stocks, deposits, transactions, reviews, transactionQueues, liveMessages, botSettings } from "@/lib/db/schema"
import { desc, eq, like, or, count, sql, getTableColumns } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { getSessionUser } from "@/lib/actions/auth"


// Verify developer access
async function verifyDeveloper() {
    const session = await getSessionUser()
    if (!session) {
        throw new Error("Unauthorized")
    }
    if (session.role !== "developer") {
        throw new Error("Developer access required")
    }
    return session
}

// Dynamic table registry - auto-detect all tables
const dbTables = {
    users,
    products,
    productSpecifications,
    stocks,
    deposits,
    transactions,
    reviews,
    transactionQueues,
    auditLogs,
    liveMessages,
    botSettings,
} as const

type TableName = keyof typeof dbTables

export async function getBackupStats() {
    await verifyDeveloper()
    try {
        const tableNames = Object.keys(dbTables) as TableName[]

        // Dynamically count all tables
        const countPromises = tableNames.map(async (name) => {
            const table = dbTables[name]
            const result = await db.select({ count: count() }).from(table)
            return { name, count: result[0].count }
        })

        const results = await Promise.all(countPromises)

        // Build stats object dynamically
        const stats: Record<string, number> = {}
        let total = 0

        for (const { name, count } of results) {
            stats[name] = count
            total += count
        }
        stats.total = total

        // Get column info for each table
        const tableInfo: Record<string, { columns: string[]; rowCount: number }> = {}
        for (const { name, count } of results) {
            const table = dbTables[name]
            const columns = Object.keys(getTableColumns(table))
            tableInfo[name] = { columns, rowCount: count }
        }

        return {
            success: true,
            data: stats,
            tableInfo,
        }
    } catch (error) {
        console.error("Stats error:", error)
        return { success: false, error: "Gagal mengambil statistik backup" }
    }
}

export async function getDatabaseBackup() {
    await verifyDeveloper()

    try {
        const tableNames = Object.keys(dbTables) as TableName[]

        // Fetch all data from all tables dynamically
        const dataPromises = tableNames.map(async (name) => {
            const table = dbTables[name]
            const rows = await db.select().from(table)
            const columns = Object.keys(getTableColumns(table))
            return { name, rows, columns }
        })

        const results = await Promise.all(dataPromises)

        // Build dynamic tables object
        const tables: Record<string, any[]> = {}
        const schema: Record<string, string[]> = {}

        for (const { name, rows, columns } of results) {
            tables[name] = rows
            schema[name] = columns
        }

        return {
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                tables,
                schema,
                metadata: {
                    version: "2.0",
                    exporter: "redfinger-backup-service",
                    tableCount: tableNames.length,
                    totalRecords: Object.values(tables).reduce((sum, arr) => sum + arr.length, 0)
                }
            }
        }
    } catch (error) {
        console.error("Backup failed:", error)
        return { success: false, error: "Gagal membuat backup database" }
    }
}

export interface AuditLogEntry {
    id: number
    action: string
    targetType: string
    targetId: number | null
    targetUserName: string | null
    targetUserEmail: string | null
    performedByName: string | null
    performedByEmail: string | null
    changes: string | null
    ipAddress: string | null
    createdAt: Date
}

export async function getAuditLogs(params: {
    page?: number
    limit?: number
    search?: string
}) {
    await verifyDeveloper()

    const { page = 1, limit = 20, search = "" } = params

    try {
        const offset = (page - 1) * limit

        // Build where clause
        const whereClause = search
            ? or(
                like(auditLogs.action, `%${search}%`),
                like(auditLogs.targetType, `%${search}%`)
            )
            : undefined

        // Get total count
        const totalResult = await db
            .select({ count: count() })
            .from(auditLogs)
            .where(whereClause)

        const total = totalResult[0]?.count || 0

        // Create alias for target user join
        const targetUsers = alias(users, "target_users")

        // Get logs with performer and target user info
        const logs = await db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                targetType: auditLogs.targetType,
                targetId: auditLogs.targetId,
                targetUserName: targetUsers.username,
                targetUserEmail: targetUsers.email,
                performedBy: auditLogs.performedBy,
                performedByName: users.username,
                performedByEmail: users.email,
                changes: auditLogs.changes,
                ipAddress: auditLogs.ipAddress,
                createdAt: auditLogs.createdAt,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.performedBy, users.id))
            .leftJoin(targetUsers, eq(auditLogs.targetId, targetUsers.id))
            .where(whereClause)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offset)

        return {
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error("Failed to fetch audit logs:", error)
        return { success: false, error: "Failed to fetch audit logs" }
    }
}
