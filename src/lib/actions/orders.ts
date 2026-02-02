"use server"

import { getSessionUser } from "@/lib/actions/auth"
import { db } from "@/lib/db"
import { users, products, transactions, stocks, transactionQueues } from "@/lib/db/schema"
import { eq, and, sql, inArray } from "drizzle-orm"
import { createTokopayOrder } from "@/lib/tokopay"
import { TOKOPAY_CHANNELS, type TokopayChannelKey } from "@/lib/tokopay-constants"
import { orderSchema, validateInput } from "@/lib/validations"
import { PAYMENT_TIMEOUT_MINUTES, PAYMENT_GRACE_PERIOD_MINUTES } from "@/lib/payment-config"
import { logger } from "@/lib/logger"

interface CreateOrderParams {
    productId: number
    quantity: number
    paymentMethod: "balance" | TokopayChannelKey
    email?: string
    whatsappNumber?: string
}

interface CreateOrderResult {
    success: boolean
    error?: string
    data?: {
        transactionId: number
        orderId: string
        paymentMethod: string
        // For QRIS/External payment
        payUrl?: string
        qrLink?: string
        qrString?: string
        totalBayar: number
        // For Balance payment - immediately fulfilled
        fulfilled?: boolean
        assignedCodes?: string[]
        itemName?: string
    }
}

export async function createProductOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const session = await getSessionUser()
    if (!session) {
        return { success: false, error: "Silakan login terlebih dahulu" }
    }
    // Session has id, username, email, role.
    // We need to pass it to internal function.
    // Note: session.balance is not guaranteed explicitly in getSessionUser return type usually, but we fetch fresh balance inside transaction for 'balance' payment.
    // For 'qris', we need username/email for invoices.

    return await createOrderInternal({
        id: session.id,
        username: session.username,
        email: session.email
    }, params)
}

// User interface for internal order creation (Web session or Bot User)
export interface OrderUser {
    id: number
    username: string
    email: string
}

export async function createOrderInternal(user: OrderUser, params: CreateOrderParams): Promise<CreateOrderResult> {
    try {
        const { productId, quantity, paymentMethod, email, whatsappNumber } = params

        // Zod Validation
        const validation = validateInput(orderSchema, {
            productId,
            quantity,
            paymentMethod,
            email,
            whatsappNumber,
        })
        if (!validation.success) {
            return { success: false, error: validation.error }
        }

        // Use transaction to ensure atomicity and handle race conditions
        return await db.transaction(async (tx) => {
            // Validate product
            const product = await tx.query.products.findFirst({
                where: eq(products.id, productId),
            })

            if (!product) {
                return { success: false, error: "Produk tidak ditemukan" }
            }

            if (product.status !== "active") {
                return { success: false, error: "Produk tidak tersedia" }
            }

            // Lock and select available stocks
            // Using for update to prevent race conditions
            const availableStocks = await tx.select()
                .from(stocks)
                .where(and(
                    eq(stocks.productId, productId),
                    eq(stocks.status, "ready")
                ))
                .limit(quantity)
                .for('update')

            if (availableStocks.length < quantity) {
                return { success: false, error: `Stok tidak mencukupi. Tersedia: ${availableStocks.length}` }
            }

            const price = parseFloat(product.price)
            const subtotal = price * quantity

            // Generate Order ID
            const now = new Date()
            const dateStr = [
                now.getDate().toString().padStart(2, '0'),
                (now.getMonth() + 1).toString().padStart(2, '0'),
                now.getHours().toString().padStart(2, '0'),
                now.getMinutes().toString().padStart(2, '0'),
            ].join('')

            const randomStr = (length: number) => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                let result = ''
                for (let i = 0; i < length; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length))
                }
                return result
            }

            const orderId = `ORD-${user.id}-${dateStr}-${randomStr(4)}`

            // Handle Balance Payment (Direct Fulfillment)
            if (paymentMethod === "balance") {
                const dbUser = await tx.query.users.findFirst({
                    where: eq(users.id, user.id),
                    columns: { balance: true }
                })
                const userBalance = parseFloat(dbUser?.balance || "0")

                if (userBalance < subtotal) {
                    return { success: false, error: `Saldo tidak mencukupi. Saldo: Rp${userBalance.toLocaleString('id-ID')}, Dibutuhkan: Rp${subtotal.toLocaleString('id-ID')}` }
                }

                const stockIds = availableStocks.map(s => s.id)
                await tx.update(stocks)
                    .set({ status: "sold", soldTo: user.id })
                    .where(inArray(stocks.id, stockIds))

                await tx.update(users)
                    .set({ balance: sql`${users.balance} - ${subtotal}` })
                    .where(eq(users.id, user.id))

                const assignedCodes = availableStocks.map(s => s.code)

                const [transaction] = await tx.insert(transactions).values({
                    orderId,
                    userId: user.id,
                    productId,
                    quantity,
                    stockId: availableStocks[0].id,
                    assignedStocks: JSON.stringify(assignedCodes),
                    price: subtotal.toString(),
                    totalAmount: subtotal.toString(),
                    paymentMethod: "balance",
                    status: "success",
                }).returning()

                return {
                    success: true,
                    data: {
                        transactionId: transaction.id,
                        orderId,
                        paymentMethod: "balance",
                        totalBayar: subtotal,
                        fulfilled: true,
                        assignedCodes,
                        itemName: product.name
                    }
                }
            }

            // Handle QRIS/External Payment (Queue Reservation)
            if (!TOKOPAY_CHANNELS[paymentMethod as TokopayChannelKey]) {
                return { success: false, error: "Metode pembayaran tidak valid" }
            }

            const expiredTs = Math.floor((Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000) / 1000)
            const expiredAt = new Date(expiredTs * 1000)

            // Reserve stocks inside transaction
            const stockIds = availableStocks.map(s => s.id)
            await tx.update(stocks)
                .set({ status: "reserved", soldTo: user.id })
                .where(inArray(stocks.id, stockIds))

            // Create Tokopay order (Side effect outside DB)
            const orderResult = await createTokopayOrder({
                amount: subtotal,
                channel: paymentMethod as TokopayChannelKey,
                refId: orderId,
                customerName: user.username,
                customerEmail: email || user.email,
                itemName: `${product.name} x${quantity}`,
                productCode: product.productId?.toUpperCase() || `PROD-${product.id}`,
                expiredTs,
            })

            if (orderResult.status === "error" || !orderResult.data) {
                // Rollback happens automatically if we throw? No, we need to throw error to rollback tx?
                // Drizzle transaction rolls back on error throw.
                throw new Error(orderResult.error_msg || "Gagal membuat pesanan pembayaran")
            }

            const tokopayData = orderResult.data

            const [transaction] = await tx.insert(transactions).values({
                orderId,
                publicId: tokopayData.trx_id,
                userId: user.id,
                productId,
                quantity,
                stockId: availableStocks[0].id,
                assignedStocks: null, // Keep NULL until paid
                price: subtotal.toString(),
                totalAmount: tokopayData.total_bayar.toString(),
                paymentMethod: paymentMethod.toUpperCase(),
                qrString: tokopayData.qr_string || null,
                paymentUrl: tokopayData.checkout_url || tokopayData.pay_url || null,
                status: "pending",
                expiredAt,
            }).returning()

            // Insert into Transaction Queues for reservation tracking
            const queueItems = availableStocks.map(s => ({
                transactionId: transaction.id,
                stockId: s.id,
                userId: user.id
            }))
            await tx.insert(transactionQueues).values(queueItems)

            return {
                success: true,
                data: {
                    transactionId: transaction.id,
                    orderId,
                    paymentMethod: paymentMethod.toUpperCase(),
                    payUrl: tokopayData.checkout_url || tokopayData.pay_url,
                    qrLink: tokopayData.qr_link,
                    totalBayar: tokopayData.total_bayar,
                    itemName: product.name
                }
            }
        })
    } catch (error: unknown) {
        logger.error("Error creating product order:", error)
        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses pesanan"
        return { success: false, error: errorMessage }
    }
}

// Get transaction by orderId or publicId (for payment page)
export async function getTransactionByOrderId(identifier: string) {
    try {
        const session = await getSessionUser()
        if (!session) return { success: false, error: "Unauthorized" }

        const transaction = await db.query.transactions.findFirst({
            where: (transactions, { eq, or }) => or(
                eq(transactions.orderId, identifier),
                eq(transactions.publicId, identifier),
                !isNaN(Number(identifier)) ? eq(transactions.id, Number(identifier)) : undefined
            ),
        })

        if (!transaction) return { success: false, error: "Transaksi tidak ditemukan" }

        if (transaction.userId !== session.id) {
            return { success: false, error: "Unauthorized access" }
        }

        const product = await db.query.products.findFirst({
            where: eq(products.id, transaction.productId),
        })

        let displayStatus = transaction.status
        if (displayStatus === "pending") {
            const now = new Date()
            const expireTime = transaction.expiredAt ? new Date(transaction.expiredAt) : new Date(new Date(transaction.createdAt).getTime() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000)

            // Grace period configured in payment-config
            if (now.getTime() > expireTime.getTime() + PAYMENT_GRACE_PERIOD_MINUTES * 60 * 1000) {
                displayStatus = "expired"
            }
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.id),
            columns: { username: true, email: true }
        })

        // SECURITY: Only reveal stocks if success
        const assignedStocks = (displayStatus === "success" || displayStatus === "refund")
            ? transaction.assignedStocks
            : null

        return {
            success: true,
            data: {
                id: transaction.id,
                paymentType: "product" as const,
                itemName: product?.name || "Produk",
                quantity: transaction.quantity,
                amount: parseFloat(transaction.price),
                totalBayar: parseFloat(transaction.totalAmount || transaction.price),
                adminFee: parseFloat(transaction.totalAmount || "0") - parseFloat(transaction.price),
                method: transaction.paymentMethod,
                status: displayStatus,
                qrString: transaction.qrString,
                payUrl: transaction.paymentUrl,
                orderId: transaction.orderId,
                publicId: transaction.publicId,
                createdAt: transaction.createdAt,
                expiredAt: transaction.expiredAt,
                customerName: user?.username || "Guest",
                customerEmail: user?.email || "-",
                assignedStocks: assignedStocks, // HIDDEN if pending
            }
        }
    } catch (error) {
        console.error("Error fetching transaction:", error)
        return { success: false, error: "Gagal mengambil data transaksi" }
    }
}
