import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deposits, transactions, stocks, users, transactionQueues } from "@/lib/db/schema"
import { eq, sql, inArray } from "drizzle-orm"
import crypto from "crypto"
import { logger } from "@/lib/logger"

const TOKOPAY_SECRET = process.env.TOKOPAY_SECRET || ""
const TOKOPAY_MERCHANT_ID = process.env.TOKOPAY_MERCHANT_ID || ""

// Verify signature from Tokopay
function verifySignature(signature: string, refId: string): boolean {
    const expectedSignature = crypto
        .createHash("md5")
        .update(`${TOKOPAY_MERCHANT_ID}:${TOKOPAY_SECRET}:${refId}`)
        .digest("hex")
    return signature === expectedSignature
}

// Interface for Tokopay Callback Data
interface TokopayCallbackBody {
    ref_id: string;
    status: string;
    signature: string;
    total_bayar: number | string;
    total_diterima: number | string;
    trx_id?: string;
    pay_code?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as TokopayCallbackBody
        const {
            ref_id,
            status,
            signature,
            total_bayar,
            total_diterima,
        } = body

        // Verify signature
        if (!verifySignature(signature, ref_id)) {
            logger.warn("Invalid signature for callback:", { ref_id, signature, ip: request.headers.get("x-forwarded-for") || "unknown" })
            return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 })
        }

        // 1. Try to find in Deposits table
        const deposit = await db.query.deposits.findFirst({
            where: eq(deposits.refId, ref_id),
        })

        if (deposit) {
            // SECURITY: Use transaction with row locking to prevent double-credit race condition
            const result = await db.transaction(async (tx) => {
                // Lock the deposit row - prevents concurrent callbacks from processing simultaneously
                const [lockedDeposit] = await tx
                    .select()
                    .from(deposits)
                    .where(eq(deposits.id, deposit.id))
                    .for('update')

                // Check status AFTER acquiring lock (critical for race condition prevention)
                if (!lockedDeposit || lockedDeposit.status === "success") {
                    return { type: "already_processed" as const }
                }

                if (status === "Paid" || status === "Success") {
                    // Update deposit status
                    await tx.update(deposits).set({
                        status: "success",
                        paidAt: new Date(),
                        totalBayar: total_bayar?.toString() || lockedDeposit.totalBayar,
                        totalDiterima: total_diterima?.toString() || lockedDeposit.totalDiterima,
                    }).where(eq(deposits.id, lockedDeposit.id))

                    // Credit user balance WITHIN THE SAME TRANSACTION
                    if (lockedDeposit.userId) {
                        const amountToAdd = parseFloat(lockedDeposit.amount)
                        await tx.update(users).set({
                            balance: sql`${users.balance} + ${amountToAdd}`,
                        }).where(eq(users.id, lockedDeposit.userId))
                    }
                    // Audit log
                    logger.info(`Deposit SUCCESS via Callback: ${ref_id} - Amount: ${lockedDeposit.amount}`)
                    return { type: "success" as const }
                } else if (status === "Expired" || status === "Failed") {
                    await tx.update(deposits).set({
                        status: status === "Expired" ? "expired" : "failed",
                    }).where(eq(deposits.id, lockedDeposit.id))
                    return { type: status.toLowerCase() as "expired" | "failed" }
                }
                return { type: "no_action" as const }
            })

            if (result.type === "already_processed") {
                return NextResponse.json({ status: "ok", message: "Already processed" })
            } else if (result.type === "success") {
                return NextResponse.json({ status: "ok", message: "Deposit processed" })
            } else if (result.type === "expired" || result.type === "failed") {
                return NextResponse.json({ status: "ok", message: `Deposit ${result.type}` })
            }
        }

        // 2. Try to find in Transactions table (Product Order)
        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.orderId, ref_id),
        })

        if (transaction) {
            if (transaction.status === "success") {
                logger.info(`Callback ignored (already success): ${ref_id}`)
                return NextResponse.json({ status: "ok", message: "Already processed" })
            }

            // Get queued stocks for this transaction
            const queuedStocks = await db.select({
                id: stocks.id,
                code: stocks.code
            })
                .from(transactionQueues)
                .innerJoin(stocks, eq(transactionQueues.stockId, stocks.id))
                .where(eq(transactionQueues.transactionId, transaction.id))

            if (status === "Paid" || status === "Success") {
                const stockCodes = queuedStocks.map(s => s.code)
                const stockIds = queuedStocks.map(s => s.id)

                await db.transaction(async (tx) => {
                    // Update transaction status and assign codes
                    await tx.update(transactions)
                        .set({
                            status: "success",
                            assignedStocks: JSON.stringify(stockCodes)
                        })
                        .where(eq(transactions.id, transaction.id))

                    // Finalize stock status to sold
                    if (stockIds.length > 0) {
                        await tx.update(stocks)
                            .set({ status: "sold" })
                            .where(inArray(stocks.id, stockIds))
                    }

                    // Clear from queue
                    await tx.delete(transactionQueues)
                        .where(eq(transactionQueues.transactionId, transaction.id))
                })

                return NextResponse.json({ status: "ok", message: "Transaction processed" })
            } else if (status === "Expired" || status === "Failed") {
                const stockIds = queuedStocks.map(s => s.id)

                await db.transaction(async (tx) => {
                    await tx.update(transactions)
                        .set({ status: "expired" })
                        .where(eq(transactions.id, transaction.id))

                    // Release reserved stocks back to ready
                    if (stockIds.length > 0) {
                        await tx.update(stocks)
                            .set({ status: "ready", soldTo: null })
                            .where(inArray(stocks.id, stockIds))
                    }

                    // Clear from queue
                    await tx.delete(transactionQueues)
                        .where(eq(transactionQueues.transactionId, transaction.id))
                })

                return NextResponse.json({ status: "ok", message: `Transaction ${status.toLowerCase()}` })
            }
        }

        logger.warn("Payment not found for ref_id:", ref_id)
        return NextResponse.json({ status: "error", message: "Payment not found" }, { status: 404 })

    } catch (error) {
        logger.error("Error processing Tokopay callback:", error)
        return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 })
    }
}

// Also support GET for testing
export async function GET() {
    return NextResponse.json({ status: "ok", message: "Tokopay callback endpoint is active" })
}
