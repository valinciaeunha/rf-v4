
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { db } from "@/lib/db"
import { transactions, deposits, stocks } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

async function cleanup() {
    console.log("Starting cleanup...")
    try {
        // 1. Delete all transactions
        const deletedTransactions = await db.delete(transactions)
        console.log("Deleted transactions successfully")

        // 2. Delete all deposits
        const deletedDeposits = await db.delete(deposits)
        console.log("Deleted deposits successfully")

        // 3. Delete all stocks
        await db.delete(stocks)
        console.log("Deleted all stocks successfully")

        console.log("Cleanup finished successfully!")
    } catch (error) {
        console.error("Cleanup failed:", error)
    }
}

cleanup()
