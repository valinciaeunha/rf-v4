import { NextRequest, NextResponse } from "next/server"
import { syncPendingPayments, processSingleDeposit, processSingleTransaction } from "@/lib/services/sync-service"
import { db } from "@/lib/db"
import { deposits, transactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = 'force-dynamic'

// API untuk sync pending deposits dengan Tokopay
// Bisa dipanggil manual atau via cron job
export async function POST(_request: NextRequest) {
    const result = await syncPendingPayments()
    if (result.success) {
        return NextResponse.json({
            status: "ok",
            results: result.results
        })
    } else {
        return NextResponse.json(
            { status: "error", message: "Failed to sync", error: result.error },
            { status: 500 }
        )
    }
}

// GET untuk check single deposit OR transaction status
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const refId = searchParams.get("ref_id")
    const depositId = searchParams.get("deposit_id")
    const orderId = searchParams.get("order_id")

    if (!refId && !depositId && !orderId) {
        return NextResponse.json(
            { status: "error", message: "ref_id, deposit_id, or order_id is required" },
            { status: 400 }
        )
    }

    try {
        // 1. Handle Deposit Check (deposit_id or ref_id)
        if (depositId || (refId && !orderId)) {
            let deposit = await db.query.deposits.findFirst({
                where: depositId
                    ? eq(deposits.id, parseInt(depositId))
                    : eq(deposits.refId, refId!),
            })

            if (deposit) {
                if (deposit.status === "pending") {
                    await processSingleDeposit(deposit)
                    const updated = await db.query.deposits.findFirst({ where: eq(deposits.id, deposit.id) })
                    if (updated) deposit = updated
                }
                return NextResponse.json({
                    status: "ok",
                    type: "deposit",
                    deposit: {
                        id: deposit.id,
                        refId: deposit.refId,
                        amount: deposit.amount,
                        status: deposit.status,
                        createdAt: deposit.createdAt,
                    }
                })
            }
        }

        // 2. Handle Transaction Check (order_id or fallback ref_id)
        if (orderId || refId) {
            let transaction = await db.query.transactions.findFirst({
                where: orderId
                    ? eq(transactions.orderId, orderId)
                    : eq(transactions.orderId, refId!),
            })

            if (transaction) {
                if (transaction.status === "pending") {
                    await processSingleTransaction(transaction)
                    const updated = await db.query.transactions.findFirst({ where: eq(transactions.id, transaction.id) })
                    if (updated) transaction = updated
                }
                return NextResponse.json({
                    status: "ok",
                    type: "transaction",
                    deposit: { // Client expects 'deposit' key
                        id: transaction.id,
                        refId: transaction.orderId,
                        amount: transaction.price,
                        status: transaction.status,
                        createdAt: transaction.createdAt,
                    }
                })
            }
        }

        return NextResponse.json(
            { status: "error", message: "Payment not found" },
            { status: 404 }
        )
    } catch (error) {
        console.error("Error checking payment status:", error)
        return NextResponse.json(
            { status: "error", message: "Failed to check status" },
            { status: 500 }
        )
    }
}
