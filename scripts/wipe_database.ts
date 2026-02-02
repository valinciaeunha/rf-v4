/**
 * Script untuk menghapus SEMUA data di database
 * HATI-HATI: Ini akan menghapus semua data!
 * 
 * Usage: npx tsx scripts/wipe_database.ts
 */

import { db } from '../src/lib/db'
import {
    users, products, productSpecifications, stocks,
    deposits, transactions, reviews, transactionQueues, auditLogs
} from '../src/lib/db/schema'
import { sql } from 'drizzle-orm'

// Table registry in reverse order (respecting foreign keys)
const tablesToDelete = [
    { name: 'auditLogs', table: auditLogs },
    { name: 'transactionQueues', table: transactionQueues },
    { name: 'reviews', table: reviews },
    { name: 'transactions', table: transactions },
    { name: 'deposits', table: deposits },
    { name: 'stocks', table: stocks },
    { name: 'productSpecifications', table: productSpecifications },
    { name: 'products', table: products },
    { name: 'users', table: users },
]

async function wipeDatabase() {
    console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!')
    console.log('Starting in 3 seconds...\n')

    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('🗑️  Deleting all data...\n')

    for (const { name, table } of tablesToDelete) {
        try {
            const result = await db.delete(table)
            console.log(`✅ Deleted all rows from: ${name}`)
        } catch (error: any) {
            console.error(`❌ Failed to delete ${name}:`, error.message)
        }
    }

    console.log('\n🔄 Resetting sequences...\n')

    const sequences = [
        'users_id_seq',
        'products_id_seq',
        'product_specifications_id_seq',
        'stocks_id_seq',
        'deposits_id_seq',
        'transactions_id_seq',
        'reviews_id_seq',
        'transaction_queues_id_seq',
        'audit_logs_id_seq',
    ]

    for (const seq of sequences) {
        try {
            await db.execute(sql.raw(`ALTER SEQUENCE ${seq} RESTART WITH 1`))
            console.log(`✅ Reset sequence: ${seq}`)
        } catch (error: any) {
            console.error(`❌ Failed to reset ${seq}:`, error.message)
        }
    }

    console.log('\n✨ Database wiped successfully!')
    console.log('All tables are now empty and sequences reset to 1.')

    process.exit(0)
}

wipeDatabase().catch(console.error)
