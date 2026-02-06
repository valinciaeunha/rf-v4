import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deposits, transactions, stocks, users, transactionQueues } from "@/lib/db/schema"
import { eq, sql, inArray } from "drizzle-orm"
import crypto from "crypto"
import { logger } from "@/lib/logger"

const TOKOPAY_SECRET = process.env.TOKOPAY_SECRET || ""
const TOKOPAY_MERCHANT_ID = process.env.TOKOPAY_MERCHANT_ID || ""

// Verify signature from Tokopay
// Signature format: MD5(merchant_id:secret:ref_id)
function verifySignature(signature: string, refId: string): { valid: boolean; expected: string } {
    const expectedSignature = crypto
        .createHash("md5")
        .update(`${TOKOPAY_MERCHANT_ID}:${TOKOPAY_SECRET}:${refId}`)
        .digest("hex")
    return {
        valid: signature === expectedSignature,
        expected: expectedSignature
    }
}

// Interface for Tokopay Callback Data
interface TokopayCallbackBody {
    ref_id?: string;
    reff_id?: string;
    status: string;
    signature: string;
    total_bayar: number | string;
    total_diterima: number | string;
    trx_id?: string;
    pay_code?: string;
}

export async function POST(request: NextRequest) {
    try {
        let data: any = {};
        const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

        // Try parsing JSON body first (for POST)
        try {
            if (request.body) {
                data = await request.json();
            }
        } catch (e) {
            // Ignore JSON parse error, might be GET request
        }

        // If data is empty, try params (for GET or mixed)
        const searchParams = request.nextUrl.searchParams;
        if (!data.ref_id && !data.reff_id && (searchParams.get('ref_id') || searchParams.get('reff_id'))) {
            data = {
                ref_id: searchParams.get('ref_id'),
                reff_id: searchParams.get('reff_id'),
                status: searchParams.get('status'),
                signature: searchParams.get('signature'),
                total_bayar: searchParams.get('total_bayar'),
                total_diterima: searchParams.get('total_diterima'),
                // Add other fields as needed
            };
        }

        // Map reff_id to ref_id
        const ref_id = data.ref_id || data.reff_id;
        const {
            status,
            signature,
            total_bayar,
            total_diterima,
        } = data;

        if (!ref_id || !signature) {
            logger.warn("Missing required fields in callback:", {
                hasRefId: !!ref_id,
                hasSignature: !!signature,
                ip: clientIp
            })
            return NextResponse.json({ status: "error", message: "Missing ref_id or signature" }, { status: 400 })
        }

        // Verify signature
        const signatureResult = verifySignature(signature, ref_id)
        if (!signatureResult.valid) {
            // Log detailed info for debugging signature issues
            // NOTE: Be careful not to log the full secret in production
            logger.warn("Invalid signature for callback:", {
                ref_id,
                receivedSignature: signature,
                expectedSignaturePrefix: signatureResult.expected.substring(0, 8) + "...",
                hasMerchantId: !!TOKOPAY_MERCHANT_ID,
                hasSecret: !!TOKOPAY_SECRET,
                ip: clientIp,
                // Hint for debugging
                hint: "Check if TOKOPAY_MERCHANT_ID and TOKOPAY_SECRET match Tokopay dashboard"
            })
            return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 })
        }

        // Log successful callback receipt
        logger.info("Received valid Tokopay callback:", { ref_id, status, ip: clientIp })

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

            if (status === "Paid" || status === "Success") {
                // SECURITY: Use transaction with row locking to prevent race condition
                const result = await db.transaction(async (tx) => {
                    // Lock the transaction row first
                    const [lockedTx] = await tx
                        .select()
                        .from(transactions)
                        .where(eq(transactions.id, transaction.id))
                        .for('update')

                    // Check if already processed AFTER acquiring lock
                    if (!lockedTx || lockedTx.status === "success") {
                        return { type: "already_processed" as const }
                    }

                    // Get queued stocks INSIDE the transaction (after lock)
                    const queuedStocks = await tx.select({
                        id: stocks.id,
                        code: stocks.code
                    })
                        .from(transactionQueues)
                        .innerJoin(stocks, eq(transactionQueues.stockId, stocks.id))
                        .where(eq(transactionQueues.transactionId, transaction.id))

                    const stockCodes = queuedStocks.map(s => s.code)
                    const stockIds = queuedStocks.map(s => s.id)

                    // IMPORTANT: If no stocks found, check stock_id from transaction
                    // This is a fallback for when transactionQueues was already cleared
                    if (stockCodes.length === 0 && lockedTx.stockId && lockedTx.userId) {
                        logger.warn(`No queued stocks found for ${ref_id}, falling back to stockId ${lockedTx.stockId}`)

                        // Get stock codes from stockId and quantity
                        const fallbackStocks = await tx.select({ id: stocks.id, code: stocks.code })
                            .from(stocks)
                            .where(eq(stocks.soldTo, lockedTx.userId))
                            .limit(lockedTx.quantity)

                        if (fallbackStocks.length > 0) {
                            stockCodes.push(...fallbackStocks.map(s => s.code))
                            stockIds.push(...fallbackStocks.map(s => s.id))
                        }
                    }

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

                    logger.info(`Transaction SUCCESS via Callback: ${ref_id} - Stocks: ${stockCodes.length}`)
                    return { type: "success" as const, stockCount: stockCodes.length }
                })

                if (result.type === "already_processed") {
                    return NextResponse.json({ status: "ok", message: "Already processed" })
                }

                return NextResponse.json({ status: "ok", message: "Transaction processed" })
            } else if (status === "Expired" || status === "Failed") {
                // Handle expired/failed with row locking
                await db.transaction(async (tx) => {
                    // Lock the transaction row first
                    const [lockedTx] = await tx
                        .select()
                        .from(transactions)
                        .where(eq(transactions.id, transaction.id))
                        .for('update')

                    if (!lockedTx || lockedTx.status !== "pending") {
                        return // Already processed
                    }

                    // Get queued stocks INSIDE the transaction
                    const queuedStocks = await tx.select({
                        id: stocks.id,
                        code: stocks.code
                    })
                        .from(transactionQueues)
                        .innerJoin(stocks, eq(transactionQueues.stockId, stocks.id))
                        .where(eq(transactionQueues.transactionId, transaction.id))

                    const stockIds = queuedStocks.map(s => s.id)

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
// Also support GET for testing and redirects
export async function GET(request: NextRequest) {
    return POST(request);
}
