/**
 * PaymentSystem - Real-time payment polling and status handling
 * 
 * Ported from bot-store-v2 PaymentSystem.js
 * Polls Tokopay API for payment status and updates channel/DM messages
 */

import { db } from '@/lib/db'
import { transactions, stocks, transactionQueues, products, users } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { checkTokopayOrderStatus } from '@/lib/tokopay'
import { TOKOPAY_CHANNELS } from '@/lib/tokopay-constants'
import { AttachmentBuilder, Message, ButtonInteraction } from 'discord.js'
import { createEmbed, successEmbed, errorEmbed } from '@/bot/utils/embed'
import { BOT_CONFIG } from '@/bot/types'
import { PAYMENT_TIMEOUT_MINUTES, PAYMENT_POLL_INTERVAL_MS } from '@/lib/payment-config'

// Format currency helper
function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`
}

interface PaymentContext {
    transactionId: number // DB ID
    orderId: string
    productId: number
    productName: string
    quantity: number
    price: number
    totalBayar: number
    paymentMethod: string // 'qris' or 'qris_realtime'
    dmMessage?: Message | null
}

export const PaymentSystem = {
    /**
     * Start polling for payment status
     * @param interaction Discord interaction (for editReply)
     * @param context Payment context
     */
    startPolling(interaction: ButtonInteraction, context: PaymentContext) {
        console.log(`[PaymentSystem] Starting polling for Order ${context.orderId}`)

        const startTime = Date.now()
        const timeout = PAYMENT_TIMEOUT_MINUTES * 60 * 1000

        const pollInterval = setInterval(async () => {
            // 1. Timeout Check
            if (Date.now() - startTime > timeout) {
                console.log(`[PaymentSystem] Timeout for ${context.orderId}`)
                clearInterval(pollInterval)
                await this.handleExpired(interaction, context, 'Timeout')
                return
            }

            try {
                // 2. Check Tokopay Status
                const tokopayChannel = TOKOPAY_CHANNELS[context.paymentMethod as keyof typeof TOKOPAY_CHANNELS] || 'QRIS'

                const result = await checkTokopayOrderStatus(
                    context.orderId,
                    undefined, // trxId (optional)
                    context.totalBayar,
                    tokopayChannel
                )

                if (!result || !result.data) {
                    // API error or null response, continue polling
                    return
                }

                const status = result.data?.status?.toLowerCase() || ''

                if (status === 'paid' || status === 'success' || status === 'berhasil') {
                    console.log(`[PaymentSystem] ✅ Payment SUCCESS: ${context.orderId}`)
                    clearInterval(pollInterval)
                    await this.handleSuccess(interaction, context)
                } else if (status === 'expired' || status === 'kadaluarsa') {
                    console.log(`[PaymentSystem] ⏱️ Payment EXPIRED: ${context.orderId}`)
                    clearInterval(pollInterval)
                    await this.handleExpired(interaction, context, 'Expired by Provider')
                }
                // else: still pending, continue polling

            } catch (err) {
                console.error('[PaymentSystem] Poll Error:', (err as Error).message)
            }

        }, PAYMENT_POLL_INTERVAL_MS)
    },

    /**
     * Handle expired payment
     */
    async handleExpired(interaction: ButtonInteraction, context: PaymentContext, reason: string) {
        console.log(`[PaymentSystem] Processing expired: ${context.orderId} (${reason})`)

        try {
            // 1. Get queued stocks and release them
            const queuedStocks = await db.select({ stockId: transactionQueues.stockId })
                .from(transactionQueues)
                .where(eq(transactionQueues.transactionId, context.transactionId))

            const stockIds = queuedStocks.map(s => s.stockId)

            // 2. Update DB in transaction
            await db.transaction(async (tx) => {
                // Update transaction status
                await tx.update(transactions)
                    .set({ status: 'expired' })
                    .where(eq(transactions.id, context.transactionId))

                // Release stocks
                if (stockIds.length > 0) {
                    await tx.update(stocks)
                        .set({ status: 'ready', soldTo: null })
                        .where(inArray(stocks.id, stockIds))
                }

                // Delete from queue
                await tx.delete(transactionQueues)
                    .where(eq(transactionQueues.transactionId, context.transactionId))
            })

            console.log(`[PaymentSystem] Released ${stockIds.length} stocks for ${context.orderId}`)

        } catch (dbError) {
            console.error('[PaymentSystem] Handle Expired DB Error:', dbError)
        }

        try {
            // 3. Create expired embed
            const expiredEmbed = errorEmbed('Yah, Waktu Habis! 🥺',
                `Waktu pembayarannya udah habis kak. Jangan ditransfer ya!\nSilakan ulangi transaksi kalau masih mau beli. 💖\n\n` +
                `**Produk:** ${context.productName} (x${context.quantity})\n` +
                `**Total:** ${formatCurrency(context.totalBayar)}\n` +
                `**Order ID:** ${context.orderId}\n` +
                `**Status:** EXPIRED`
            )

            // 4. Edit ephemeral reply in channel
            await interaction.editReply({
                embeds: [expiredEmbed],
                components: [],
                files: []
            }).catch((e: Error) => {
                console.warn('[PaymentSystem] Failed to edit channel reply on expire:', e.message)
            })

            // 5. Edit DM message if exists
            if (context.dmMessage) {
                await context.dmMessage.edit({
                    embeds: [expiredEmbed],
                    components: [],
                    files: []
                }).catch((e: Error) => {
                    console.warn('[PaymentSystem] Failed to edit DM on expire:', e.message)
                })
            }

        } catch (uiError) {
            console.error('[PaymentSystem] Handle Expired UI Error:', uiError)
        }
    },

    /**
     * Handle successful payment
     */
    async handleSuccess(interaction: ButtonInteraction, context: PaymentContext) {
        console.log(`[PaymentSystem] Processing success: ${context.orderId}`)

        let stockCodes: string[] = []
        let alreadyProcessed = false

        try {
            // 1. Check if already processed
            const [existingTx] = await db.select({ status: transactions.status, assignedStocks: transactions.assignedStocks })
                .from(transactions)
                .where(eq(transactions.id, context.transactionId))

            if (existingTx?.status === 'success') {
                console.log(`[PaymentSystem] Order ${context.orderId} already processed`)
                alreadyProcessed = true
                // Parse existing stocks for display
                if (existingTx.assignedStocks) {
                    try {
                        stockCodes = JSON.parse(existingTx.assignedStocks)
                    } catch { }
                }
            }

            if (!alreadyProcessed) {
                // 2. Get queued stocks
                const queuedStocks = await db.select({
                    id: stocks.id,
                    code: stocks.code
                })
                    .from(transactionQueues)
                    .innerJoin(stocks, eq(transactionQueues.stockId, stocks.id))
                    .where(eq(transactionQueues.transactionId, context.transactionId))

                stockCodes = queuedStocks.map(s => s.code)
                const stockIds = queuedStocks.map(s => s.id)

                // 3. Update DB in transaction
                await db.transaction(async (tx) => {
                    // Update transaction status
                    await tx.update(transactions)
                        .set({
                            status: 'success',
                            assignedStocks: JSON.stringify(stockCodes)
                        })
                        .where(eq(transactions.id, context.transactionId))

                    // Mark stocks as sold
                    if (stockIds.length > 0) {
                        await tx.update(stocks)
                            .set({ status: 'sold' })
                            .where(inArray(stocks.id, stockIds))
                    }

                    // Delete from queue
                    await tx.delete(transactionQueues)
                        .where(eq(transactionQueues.transactionId, context.transactionId))
                })

                console.log(`[PaymentSystem] Marked ${stockIds.length} stocks as sold for ${context.orderId}`)
            }

        } catch (dbError) {
            console.error('[PaymentSystem] Handle Success DB Error:', dbError)
            return
        }

        try {
            // 4. Create success embed
            const successEmbedMsg = successEmbed('Pembelian Berhasil! ✅',
                `Terima kasih telah berbelanja **${context.productName}**!\n\n` +
                `**Jumlah:** ${context.quantity}x\n` +
                `**Total:** ${formatCurrency(context.totalBayar)}\n` +
                `**Order ID:** ${context.orderId}\n` +
                `**Metode:** QRIS\n\n` +
                (stockCodes.length > 0 ? `Silakan unduh file terlampir untuk melihat kode pesanan Anda.` : '')
            )

            // 5. Prepare stock file if available
            let files: AttachmentBuilder[] = []
            if (stockCodes.length > 0) {
                const stockText = stockCodes.join('\n')
                const buffer = Buffer.from(stockText, 'utf-8')
                const attachment = new AttachmentBuilder(buffer, { name: `order-${context.orderId}.txt` })
                files = [attachment]
            }

            // 6. Edit ephemeral reply in channel
            await interaction.editReply({
                embeds: [successEmbedMsg],
                components: [],
                files: files
            }).catch((e: Error) => {
                console.warn('[PaymentSystem] Failed to edit channel reply on success:', e.message)
            })

            // 7. Edit DM message if exists
            if (context.dmMessage) {
                await context.dmMessage.edit({
                    embeds: [successEmbedMsg],
                    components: [],
                    files: files
                }).catch((e: Error) => {
                    console.warn('[PaymentSystem] Failed to edit DM on success:', e.message)
                })
            } else {
                // Send new DM if no existing
                try {
                    const discordUser = interaction.user
                    await discordUser.send({
                        embeds: [successEmbedMsg],
                        files: files
                    })
                } catch (dmErr) {
                    console.warn('[PaymentSystem] Failed to send success DM:', (dmErr as Error).message)
                }
            }

            // 8. Mark as notified
            await db.update(transactions)
                .set({ isNotified: true })
                .where(eq(transactions.id, context.transactionId))

        } catch (uiError) {
            console.error('[PaymentSystem] Handle Success UI Error:', uiError)
        }
    }
}

export default PaymentSystem
