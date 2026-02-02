
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

async function checkTime() {
    const orderId = "ORD-6-31011648-8BE0"
    const tx = await db.query.transactions.findFirst({
        where: eq(transactions.orderId, orderId)
    })

    if (!tx) {
        console.log("Tx not found")
        return
    }

    const now = Date.now()
    const createdAt = new Date(tx.createdAt).getTime()
    const diff = now - createdAt
    const diffMinutes = diff / 1000 / 60

    console.log("Current Time:", new Date(now).toISOString())
    console.log("Tx CreatedAt:", new Date(tx.createdAt).toISOString())
    console.log("Tx ExpiredAt:", tx.expiredAt ? new Date(tx.expiredAt).toISOString() : "null")
    console.log("Diff (minutes):", diffMinutes)
    console.log("Status:", tx.status)

    const EXPIRE_THRESHOLD = (15 * 60 * 1000) + 10000
    if (now > createdAt + EXPIRE_THRESHOLD) {
        console.log("Server logic would EXPIRE it (based on timeout)")
    } else {
        console.log("Server logic would NOT expire it (based on timeout)")
    }
}

checkTime()
