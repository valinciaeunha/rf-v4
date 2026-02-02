
import { db } from "@/lib/db"
import { deposits, users, transactions, stocks, transactionQueues } from "@/lib/db/schema"
import { eq, sql, and, lt, inArray } from "drizzle-orm"
import { checkTokopayOrderStatus } from "@/lib/tokopay"
import { TOKOPAY_CHANNELS, type TokopayChannelKey } from "@/lib/tokopay-constants"
import { PAYMENT_TIMEOUT_MINUTES, PAYMENT_GRACE_PERIOD_MINUTES } from "@/lib/payment-config"
import { logger } from "@/lib/logger"


// Define types
type Deposit = typeof deposits.$inferSelect;
type Transaction = typeof transactions.$inferSelect;

export async function processSingleDeposit(deposit: Deposit) {
    try {
        if (!deposit.refId) return { updated: false }

        // Convert internal payment method key to Tokopay channel code if needed
        const paymentMethodKey = deposit.paymentChannel as TokopayChannelKey
        const channelCode = TOKOPAY_CHANNELS[paymentMethodKey] || deposit.paymentChannel

        const statusResult = await checkTokopayOrderStatus(
            deposit.refId,
            undefined,
            parseFloat(deposit.amount),
            channelCode
        )

        if (!statusResult) return { updated: false, failed: true }

        const tokopayStatus = (statusResult.data?.status || statusResult.status || "").toString().toLowerCase()

        if (tokopayStatus === "paid" || tokopayStatus === "success" || tokopayStatus === "berhasil") {
            // SECURITY: Use transaction with row locking to prevent double-credit race condition
            // This prevents race between polling and callback from crediting balance twice
            const result = await db.transaction(async (tx) => {
                // Lock the deposit row
                const [lockedDeposit] = await tx
                    .select()
                    .from(deposits)
                    .where(eq(deposits.id, deposit.id))
                    .for('update')

                // Check status AFTER acquiring lock
                if (!lockedDeposit || lockedDeposit.status === "success") {
                    return { alreadyProcessed: true }
                }

                // Update deposit status
                await tx.update(deposits).set({
                    status: "success",
                    paidAt: new Date(),
                }).where(eq(deposits.id, lockedDeposit.id))

                // Credit balance WITHIN THE SAME TRANSACTION
                if (lockedDeposit.userId) {
                    const amountToAdd = parseFloat(lockedDeposit.amount)
                    await tx.update(users)
                        .set({ balance: sql`${users.balance} + ${amountToAdd}` })
                        .where(eq(users.id, lockedDeposit.userId))
                }
                return { alreadyProcessed: false }
            })

            if (result.alreadyProcessed) {
                return { updated: false } // Already processed by callback, skip
            }
            return { updated: true, status: "success", amount: deposit.amount }
        } else if (tokopayStatus === "expired" || tokopayStatus === "kadaluarsa") {
            await db.update(deposits).set({ status: "expired" }).where(eq(deposits.id, deposit.id))
            return { updated: true, status: "expired" }
        } else if (tokopayStatus === "failed" || tokopayStatus === "gagal") {
            await db.update(deposits).set({ status: "failed" }).where(eq(deposits.id, deposit.id))
            return { updated: true, status: "failed" }
        } else {
            // Timeout Check (Safety buffer 16 mins)
            const createdAtTime = new Date(deposit.createdAt).getTime()
            const now = Date.now()
            if (now > createdAtTime + 16 * 60 * 1000) {
                await db.update(deposits).set({ status: "expired" }).where(eq(deposits.id, deposit.id))
                return { updated: true, status: "expired (timeout)" }
            }
        }
        return { updated: false }
    } catch (error) {
        logger.error(`Error processing deposit ${deposit.id}:`, error)
        return { updated: false, failed: true }
    }
}

export async function processSingleTransaction(trx: Transaction) {
    try {
        if (!trx.orderId) return { updated: false }



        let tokopayStatus = null
        try {
            // Convert internal payment method key to Tokopay channel code
            const paymentMethodKey = trx.paymentMethod as TokopayChannelKey
            const channelCode = TOKOPAY_CHANNELS[paymentMethodKey] || trx.paymentMethod

            const statusResult = await checkTokopayOrderStatus(
                trx.orderId,
                undefined,
                parseFloat(trx.totalAmount || trx.price),
                channelCode
            )
            if (statusResult) {
                tokopayStatus = statusResult.data?.status || statusResult.status
            }
        } catch (e) {
            // Ignore API errors
        }

        const tpStatus = (tokopayStatus || "").toString().toLowerCase()

        if (tpStatus === "paid" || tpStatus === "success" || tpStatus === "berhasil") {
            // Get queued stocks
            const queuedStocks = await db.select({
                id: stocks.id,
                code: stocks.code
            })
                .from(transactionQueues)
                .innerJoin(stocks, eq(transactionQueues.stockId, stocks.id))
                .where(eq(transactionQueues.transactionId, trx.id))

            const stockCodes = queuedStocks.map(s => s.code)
            const stockIds = queuedStocks.map(s => s.id)

            await db.transaction(async (tx) => {
                await tx.update(transactions)
                    .set({
                        status: "success",
                        assignedStocks: JSON.stringify(stockCodes)
                    })
                    .where(eq(transactions.id, trx.id))

                if (stockIds.length > 0) {
                    await tx.update(stocks)
                        .set({ status: "sold" })
                        .where(inArray(stocks.id, stockIds))
                }

                await tx.delete(transactionQueues)
                    .where(eq(transactionQueues.transactionId, trx.id))
            })

            return { updated: true, status: "success" }
        } else if (tpStatus === "expired" || tpStatus === "kadaluarsa") {
            const queuedStocks = await db.select({ id: transactionQueues.stockId })
                .from(transactionQueues)
                .where(eq(transactionQueues.transactionId, trx.id))

            const stockIds = queuedStocks.map(s => s.id)

            await db.transaction(async (tx) => {
                await tx.update(transactions)
                    .set({ status: "expired" })
                    .where(eq(transactions.id, trx.id))

                if (stockIds.length > 0) {
                    await tx.update(stocks)
                        .set({ status: "ready", soldTo: null })
                        .where(inArray(stocks.id, stockIds))
                }

                await tx.delete(transactionQueues)
                    .where(eq(transactionQueues.transactionId, trx.id))
            })

            return { updated: true, status: "expired" }
        } else {
            // Timeout Check using config
            const createdAtTime = new Date(trx.createdAt).getTime()
            const expireTime = trx.expiredAt ? new Date(trx.expiredAt).getTime() : createdAtTime + PAYMENT_TIMEOUT_MINUTES * 60 * 1000
            const now = Date.now()
            const expireWithGrace = expireTime + PAYMENT_GRACE_PERIOD_MINUTES * 60 * 1000

            // Grace period configured in payment-config
            if (now > expireWithGrace) {

                const queuedStocks = await db.select({ id: transactionQueues.stockId })
                    .from(transactionQueues)
                    .where(eq(transactionQueues.transactionId, trx.id))

                const stockIds = queuedStocks.map(s => s.id)

                await db.transaction(async (tx) => {
                    await tx.update(transactions)
                        .set({ status: "expired" })
                        .where(eq(transactions.id, trx.id))

                    if (stockIds.length > 0) {
                        await tx.update(stocks)
                            .set({ status: "ready", soldTo: null })
                            .where(inArray(stocks.id, stockIds))
                    }

                    await tx.delete(transactionQueues)
                        .where(eq(transactionQueues.transactionId, trx.id))
                })

                return { updated: true, status: "expired (timeout)" }
            }
        }
        return { updated: false }
    } catch (error) {
        logger.error(`Error processing transaction ${trx.id}:`, error)
        return { updated: false, failed: true }
    }
}

export async function syncPendingPayments() {
    const results = {
        checked: 0,
        updated: 0,
        failed: 0,
        details: [] as Record<string, unknown>[],
    }

    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

        // Sync Deposits
        const pendingDeposits = await db.query.deposits.findMany({
            where: and(eq(deposits.status, "pending"), lt(deposits.createdAt, fiveMinutesAgo)),
            limit: 50,
        })

        for (const deposit of pendingDeposits) {
            results.checked++
            const res = await processSingleDeposit(deposit)
            if (res.updated) {
                results.updated++
                results.details.push({ id: deposit.id, refId: deposit.refId, status: res.status })
            }
            if (res.failed) results.failed++
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Sync Transactions
        const pendingTransactions = await db.query.transactions.findMany({
            where: and(eq(transactions.status, "pending"), lt(transactions.createdAt, fiveMinutesAgo)),
            limit: 50,
        })

        for (const trx of pendingTransactions) {
            results.checked++
            const res = await processSingleTransaction(trx)
            if (res.updated) {
                results.updated++
                results.details.push({ id: trx.id, orderId: trx.orderId, status: res.status })
            }
            if (res.failed) results.failed++
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        return { success: true, results }
    } catch (error) {
        logger.error("Sync service error:", error)
        return { success: false, error }
    }
}
