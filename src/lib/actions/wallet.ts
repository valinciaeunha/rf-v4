"use server"

import { getSessionUser } from "@/lib/actions/auth"
import { db } from "@/lib/db"
import { users, deposits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createTokopayOrder } from "@/lib/tokopay"
import { TOKOPAY_CHANNELS, type TokopayChannelKey } from "@/lib/tokopay-constants"
import { topUpSchema, validateInput } from "@/lib/validations"
import { PAYMENT_TIMEOUT_MINUTES } from "@/lib/payment-config"
import { logger } from "@/lib/logger"

export async function getWalletBalance() {
    try {
        const session = await getSessionUser()
        if (!session) return { success: false, error: "Unauthorized" }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.id),
            columns: {
                balance: true
            }
        })

        if (!user) return { success: false, error: "User not found" }

        return { success: true, data: { balance: user.balance } }
    } catch (error) {
        console.error("Error fetching wallet balance:", error)
        return { success: false, error: "Failed to fetch balance" }
    }
}

interface TopUpParams {
    amount: number
    paymentMethod: TokopayChannelKey
}

interface TopUpResult {
    success: boolean
    error?: string
    data?: {
        depositId: number
        refId: string
        trxId: string
        payUrl: string
        qrLink?: string
        qrString?: string
        payCode?: string
        nomorVa?: string
        totalBayar: number
        expireTime?: number
    }
}

export async function createTopUp(params: TopUpParams): Promise<TopUpResult> {
    try {
        const session = await getSessionUser()
        if (!session) {
            return { success: false, error: "Silakan login terlebih dahulu" }
        }

        const { amount, paymentMethod } = params

        // Zod Validation
        const validation = validateInput(topUpSchema, { amount, paymentMethod })
        if (!validation.success) {
            return { success: false, error: validation.error }
        }

        // Validate payment method exists
        if (!TOKOPAY_CHANNELS[paymentMethod]) {
            return { success: false, error: "Metode pembayaran tidak valid" }
        }

        // Generate clean unique reference ID
        // Format: INV-[USERID]-[DDmmHHMM]-[RANDOM]
        // Example: INV-6-30012345-X9Y2
        const now = new Date()
        // Format: DDMMHHmm (Example: 30012359 for Date 30, Month 01, Time 23:59)
        const dateStr = [
            now.getDate().toString().padStart(2, '0'),
            (now.getMonth() + 1).toString().padStart(2, '0'),
            now.getHours().toString().padStart(2, '0'),
            now.getMinutes().toString().padStart(2, '0')
        ].join('')

        // Custom random string (Uppercase Alphanumeric only, no symbols)
        const customNanoid = (length: number) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let result = ''
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return result
        }

        const refId = `INV-${session.id}-${dateStr}-${customNanoid(4)}`

        // Set expire time using env config (UNIX Timestamp in seconds)
        const expiredTs = Math.floor((Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000) / 1000)

        // Create order via Tokopay
        const orderResult = await createTokopayOrder({
            amount,
            channel: paymentMethod,
            refId,
            customerName: session.username,
            customerEmail: session.email,
            itemName: "Top Up Saldo Redfinger",
            expiredTs: expiredTs // Send expired time
        })

        if (orderResult.status === "error" || !orderResult.data) {
            console.error("Tokopay order failed:", orderResult.error_msg)
            return {
                success: false,
                error: orderResult.error_msg || "Gagal membuat pesanan pembayaran"
            }
        }

        const tokopayData = orderResult.data

        // Save deposit record to database
        const [deposit] = await db.insert(deposits).values({
            userId: session.id,
            amount: amount.toString(),
            totalBayar: tokopayData.total_bayar.toString(),
            totalDiterima: tokopayData.total_diterima.toString(),
            paymentChannel: paymentMethod.toUpperCase(),
            refId: tokopayData.ref_id || refId,
            trxId: tokopayData.trx_id,
            qrLink: tokopayData.qr_link || "",
            qrString: tokopayData.qr_string || "",
            payUrl: tokopayData.checkout_url || tokopayData.pay_url || "",
            status: "pending",
            source: "web",
        }).returning()



        return {
            success: true,
            data: {
                depositId: deposit.id,
                refId: tokopayData.ref_id || refId,
                trxId: tokopayData.trx_id,
                payUrl: tokopayData.checkout_url || tokopayData.pay_url,
                qrLink: tokopayData.qr_link,
                qrString: tokopayData.qr_string,
                payCode: tokopayData.pay_code,
                nomorVa: tokopayData.nomor_va,
                totalBayar: tokopayData.total_bayar,
                expireTime: tokopayData.expire_time,
            },
        }
    } catch (error) {
        console.error("Error creating top up:", error)
        return { success: false, error: "Terjadi kesalahan saat memproses top up" }
    }
}

// Support search by ID (number), refId (string), or trxId (string)
export async function getDepositByTrxId(identifier: string | number) {
    try {
        const session = await getSessionUser()
        if (!session) return { success: false, error: "Unauthorized" }

        // Try to find by multiple columns
        // 1. If it looks like a generic Transaction ID or Ref ID
        // 2. Or fallback to numeric ID search if it can be parsed

        const deposit = await db.query.deposits.findFirst({
            where: (deposits, { eq, or }) => or(
                eq(deposits.trxId, identifier.toString()),
                eq(deposits.refId, identifier.toString()),
                // Only try matching ID if parsed identifier is a valid number and matches input
                !isNaN(Number(identifier)) ? eq(deposits.id, Number(identifier)) : undefined
            ),
        })

        if (!deposit) return { success: false, error: "Deposit not found" }

        // Ensure user owns the deposit
        if (deposit.userId !== session.id) return { success: false, error: "Unauthorized access to deposit" }

        // Logic check expired otomatis (Lazy Check Visual Only)
        // Kita tidak update DB di sini untuk menghindari race condition (misal user sudah bayar tapi callback telat)
        // Biarkan API Sync yang melakukan update DB setelah validasi ke Tokopay
        let displayStatus = deposit.status
        if (displayStatus === 'pending') {
            const createdAtData = new Date(deposit.createdAt).getTime()
            const now = Date.now()
            const EXPIRE_DURATION = PAYMENT_TIMEOUT_MINUTES * 60 * 1000

            if (now > createdAtData + EXPIRE_DURATION) {
                // Hanya ubah status untuk tampilan ke user
                displayStatus = 'expired'
            }
        }

        // Fetch User details for invoice
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, deposit.userId!),
            columns: {
                username: true,
                email: true,
            }
        })

        const amountOriginal = parseFloat(deposit.amount)
        const totalBayar = parseFloat(deposit.totalBayar) || amountOriginal
        const adminFee = totalBayar > amountOriginal ? totalBayar - amountOriginal : 0

        return {
            success: true,
            data: {
                id: deposit.id,
                paymentType: "deposit" as const, // Indicates this is a top up, not product purchase
                itemName: "Top Up Saldo",
                amount: amountOriginal, // Nominal Top Up
                totalBayar: totalBayar, // Total harus dibayar
                adminFee: adminFee,
                method: deposit.paymentChannel,
                status: displayStatus, // Gunakan status terbaru
                qrLink: deposit.qrLink,
                qrString: deposit.qrString,
                payUrl: deposit.payUrl,
                trxId: deposit.trxId,
                refId: deposit.refId,
                nomorVa: deposit.refId,
                createdAt: deposit.createdAt,
                customerName: user?.username || "Guest",
                customerEmail: user?.email || "-",
            }
        }
    } catch (error) {
        console.error("Error fetching deposit:", error)
        return { success: false, error: "Failed to fetch deposit" }
    }
}
