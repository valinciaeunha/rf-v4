import { db } from "../src/lib/db"
import { transactions, users } from "../src/lib/db/schema"
import { eq } from "drizzle-orm"

async function checkUser() {
    // 1. Check user exists
    const user = await db.query.users.findFirst({
        where: eq(users.id, 42901)
    })
    console.log("User:", user)

    // 2. Check transactions
    const txs = await db.query.transactions.findMany({
        where: eq(transactions.userId, 42901)
    })
    console.log("Transactions count:", txs.length)
    console.log("Last Transaction:", txs[0])
}

checkUser().catch(console.error).finally(() => process.exit())
