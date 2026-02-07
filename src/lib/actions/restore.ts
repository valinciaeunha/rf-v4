"use server"

import { db } from "@/lib/db"
import {
    users, products, productSpecifications, stocks,
    deposits, transactions, reviews, transactionQueues, auditLogs,
    tickets, ticketMessages, liveMessages, botSettings
} from "@/lib/db/schema"
import { getSessionUser } from "@/lib/actions/auth"
import { sql } from "drizzle-orm"

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

// Table registry with correct insertion order (respecting foreign keys)
const tableRegistry = [
    { name: 'users', table: users },
    { name: 'products', table: products },
    { name: 'productSpecifications', table: productSpecifications },
    { name: 'stocks', table: stocks },
    { name: 'deposits', table: deposits },
    { name: 'transactions', table: transactions },
    { name: 'reviews', table: reviews },
    { name: 'transactionQueues', table: transactionQueues },
    { name: 'tickets', table: tickets },
    { name: 'ticketMessages', table: ticketMessages },
    { name: 'liveMessages', table: liveMessages },
    { name: 'botSettings', table: botSettings },
    { name: 'auditLogs', table: auditLogs },
] as const

interface RestoreData {
    timestamp: string
    tables: Record<string, any[]>
    schema?: Record<string, string[]>
    metadata?: {
        version: string
        exporter: string
        tableCount?: number
        totalRecords?: number
    }
}

// Helper function to chunk array into smaller pieces
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
}

// Process date strings in row data
function processRow(row: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {}
    for (const [key, value] of Object.entries(row)) {
        if (value && typeof value === 'string') {
            // Check if it's a date string (ISO format)
            if (key.toLowerCase().includes('at') || key === 'createdAt' || key === 'updatedAt' || key === 'paidAt' || key === 'expiredAt') {
                const date = new Date(value)
                if (!isNaN(date.getTime())) {
                    processed[key] = date
                    continue
                }
            }
        }
        processed[key] = value
    }
    return processed
}

const BATCH_SIZE = 100 // Insert 100 rows at a time

export async function restoreFromJson(jsonData: RestoreData, confirmPhrase: string) {
    const session = await verifyDeveloper()

    // Validate confirmation phrase
    if (confirmPhrase !== "RESTORE DATABASE") {
        return { success: false, error: "Invalid confirmation phrase" }
    }

    // Validate JSON structure
    if (!jsonData.tables || typeof jsonData.tables !== 'object') {
        return { success: false, error: "Invalid backup format: missing 'tables' object" }
    }

    try {
        const results: Record<string, { deleted: number; inserted: number }> = {}

        // Process tables in reverse order for deletion (to respect foreign keys)
        const reversedRegistry = [...tableRegistry].reverse()

        // Step 1: Delete all existing data (in reverse order to handle FK)
        for (const { name, table } of reversedRegistry) {
            await db.delete(table)
        }

        // Step 2: Reset sequences for serial/bigserial columns
        await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE product_specifications_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE stocks_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE deposits_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE transactions_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE reviews_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE transaction_queues_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE tickets_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE ticket_messages_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE live_messages_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE bot_settings_id_seq RESTART WITH 1`)
        await db.execute(sql`ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1`)

        // Step 3: Insert data in correct order with batching
        for (const { name, table } of tableRegistry) {
            const tableData = jsonData.tables[name]

            if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
                results[name] = { deleted: 0, inserted: 0 }
                continue
            }

            // Process data in chunks to avoid stack overflow
            const chunks = chunkArray(tableData, BATCH_SIZE)
            let inserted = 0

            for (const chunk of chunks) {
                // Process each row to convert date strings
                const processedChunk = chunk.map(processRow)

                // Insert batch
                await db.insert(table).values(processedChunk)
                inserted += chunk.length
            }

            // Update sequence to max ID + 1
            let maxId = 0
            for (const row of tableData) {
                if (row.id && row.id > maxId) maxId = row.id
            }

            if (maxId > 0) {
                const seqName = `${name === 'productSpecifications' ? 'product_specifications' :
                    name === 'transactionQueues' ? 'transaction_queues' :
                        name === 'auditLogs' ? 'audit_logs' :
                            name === 'ticketMessages' ? 'ticket_messages' :
                                name === 'liveMessages' ? 'live_messages' :
                                    name === 'botSettings' ? 'bot_settings' : name}_id_seq`
                await db.execute(sql.raw(`ALTER SEQUENCE ${seqName} RESTART WITH ${maxId + 1}`))
            }

            results[name] = { deleted: 0, inserted: tableData.length }
        }

        return {
            success: true,
            message: "Database restored successfully from JSON",
            details: {
                timestamp: jsonData.timestamp,
                restoredBy: session.email,
                completedAt: new Date().toISOString(),
                tables: results,
            }
        }

    } catch (error: any) {
        console.error(`[JSON Restore] Failed:`, error)
        return {
            success: false,
            error: error.message || "Failed to restore from JSON",
        }
    }
}
