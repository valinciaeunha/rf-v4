import { db } from '../src/lib/db'
import { transactions, stocks, transactionQueues } from '../src/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

async function simulateSuccess(orderId: string) {
    console.log(`Simulating success for Order: ${orderId}`)

    const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.orderId, orderId),
    })

    if (!transaction) {
        console.error("Transaction not found")
        process.exit(1)
    }

    if (transaction.status === "success") {
        console.log("Already success")
        process.exit(0)
    }

    // Get queued stocks
    const queuedStocks = await db.select({
        id: stocks.id,
        code: stocks.code
    })
        .from(transactionQueues)
        .innerJoin(stocks, eq(transactionQueues.stockId, stocks.id))
        .where(eq(transactionQueues.transactionId, transaction.id))

    const stockCodes = queuedStocks.map(s => s.code)
    const stockIds = queuedStocks.map(s => s.id)

    await db.transaction(async (tx) => {
        await tx.update(transactions)
            .set({
                status: "success",
                assignedStocks: JSON.stringify(stockCodes)
            })
            .where(eq(transactions.id, transaction.id))

        if (stockIds.length > 0) {
            await tx.update(stocks)
                .set({ status: "sold" })
                .where(inArray(stocks.id, stockIds))
        }

        await tx.delete(transactionQueues)
            .where(eq(transactionQueues.transactionId, transaction.id))
    })

    console.log("Status updated to success. Now bot monitor should pick it up.")
    process.exit(0)
}

const orderId = process.argv[2]
if (!orderId) {
    console.error("Provide Order ID")
    process.exit(1)
}

simulateSuccess(orderId).catch(e => {
    console.error(e)
    process.exit(1)
})
