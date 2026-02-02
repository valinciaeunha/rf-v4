
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

async function debugTypes() {
    const tx = await db.query.transactions.findFirst({
        where: eq(transactions.orderId, "ORD-6-31011648-8BE0")
    })

    if (!tx) {
        console.log("Not found")
        return
    }

    console.log("createdAt type:", typeof tx.createdAt)
    console.log("createdAt instance of Date:", tx.createdAt instanceof Date)
    console.log("createdAt value:", tx.createdAt)
    console.log("createdAt toString:", tx.createdAt.toString())
    console.log("createdAt toISOString:", (tx.createdAt as any).toISOString ? (tx.createdAt as any).toISOString() : "N/A")
}
debugTypes()
