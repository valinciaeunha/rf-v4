import { db } from '@/lib/db'
import { transactions, products } from '@/lib/db/schema'
import { eq, and, isNotNull, or, inArray } from 'drizzle-orm'
import { ExtendedClient } from '../types'
import { createEmbed, formatCurrency, successEmbed, errorEmbed } from '../utils'
import { AttachmentBuilder } from 'discord.js'
import { BOT_CONFIG } from '../types'
import { processSingleTransaction } from '@/lib/services/sync-service'

export function startPaymentMonitor(client: ExtendedClient) {
    console.log('[Bot] Payment Monitor Service started.')

    // Run every 15 seconds (faster polling for bot)
    setInterval(async () => {
        try {
            // 1. First, sync pending transactions with Tokopay API
            // This handles transactions that were pending before bot restart
            await syncBotPendingTransactions(client)

            // 2. Check for EXPIRED pending transactions (Web & Bot)
            // This handles local timeout for transactions not actively polled or Web transactions
            await checkPendingTransactions(client)

            // 3. Check for completed transactions that need DM notification
            await checkCompletedTransactions(client)

            // 4. Check for EXPIRED transactions that haven't been notified (fix race condition with web polling)
            await checkExpiredTransactions(client)
            // 5. Sync Pending Deposits (Web & Bot)
            // Ensures automated checks for topups even if realtime poller fails
            await syncPendingDeposits(client)
        } catch (error) {
            console.error('[Payment Monitor] Error:', error)
        }
    }, 15000)
}

async function checkExpiredTransactions(client: ExtendedClient) {
    const expiredTxs = await db.query.transactions.findMany({
        where: and(
            eq(transactions.status, 'expired'),
            eq(transactions.isNotified, false)
        ),
        limit: 10
    })

    // Import NotificationSystem
    const { NotificationSystem } = await import('./NotificationSystem')
    const { products } = await import('@/lib/db/schema')
    const GUILD_ID = process.env.DISCORD_GUILD_ID || ''

    for (const trx of expiredTxs) {
        console.log(`[Payment Monitor] Order ${trx.orderId} found expired but not notified. Updating...`)

        // 1. Send Expired Log to Channel
        let productName = 'Unknown Product'
        if (trx.productId) {
            const prod = await db.query.products.findFirst({
                where: eq(products.id, trx.productId)
            })
            if (prod) productName = prod.name
        }

        let username = 'Guest'
        let discordUser = null
        if (trx.userId) {
            const user = await client.users.fetch(trx.userId.toString()).catch(() => null)
            if (user) {
                username = `${user} (${user.username})`
                discordUser = user
            }
        }

        await NotificationSystem.sendExpiredLog(client, {
            username: username,
            productName: productName,
            quantity: trx.quantity,
            refId: trx.orderId!,
            reason: 'Waktu pembayaran habis (Timeout)'
        }, GUILD_ID)

        // 2. DM Notification (Only if DM ID exists)
        if (trx.dmMessageId && discordUser) {
            try {
                const dmChannel = await discordUser.createDM().catch(() => null)
                if (dmChannel) {
                    const message = await dmChannel.messages.fetch(trx.dmMessageId).catch(() => null)
                    if (message) {
                        const embed = errorEmbed(
                            'Pembayaran Kedaluwarsa',
                            `Mohon maaf, waktu pembayaran untuk order **${trx.orderId}** telah habis.`
                        )
                        await message.edit({ embeds: [embed], components: [], files: [] }).catch(e => console.error(`[Payment Monitor] Failed to edit DM expired: ${e.message}`))
                    }
                }
            } catch (err) {
                console.error(`[Payment Monitor] Error handling expired DM for ${trx.orderId}:`, err)
            }
        }

        // 3. Mark as notified
        await db.update(transactions)
            .set({ isNotified: true })
            .where(eq(transactions.id, trx.id))
    }
}

// New function to sync pending transactions from bot
async function syncBotPendingTransactions(client: ExtendedClient) {
    try {
        // Get pending transactions that have dmMessageId (bot transactions)
        const pendingTxs = await db.query.transactions.findMany({
            where: and(
                eq(transactions.status, 'pending'),
                isNotNull(transactions.dmMessageId)
            ),
            limit: 20
        })




        if (pendingTxs.length > 0) {
            console.log(`[Payment Monitor] Found ${pendingTxs.length} orphaned pending transactions`)
        }

        for (const trx of pendingTxs) {
            try {
                const result = await processSingleTransaction(trx)

                if (result.updated) {
                    console.log(`[Payment Monitor] Synced transaction ${trx.orderId}: ${result.status}`)

                    // Update DM Message if available
                    if (trx.dmMessageId && trx.userId) {
                        try {
                            const user = await client.users.fetch(trx.userId.toString()).catch(() => null)
                            if (user) {
                                const dmChannel = await user.createDM().catch(() => null)
                                if (dmChannel) {
                                    const message = await dmChannel.messages.fetch(trx.dmMessageId).catch(() => null)
                                    if (message) {
                                        // Determine new embed state
                                        if (result.status === 'success' || result.status?.includes('success')) {
                                            const embed = successEmbed(
                                                'Pembayaran Berhasil',
                                                `Terima kasih! Pembayaran untuk order **${trx.orderId}** telah diterima.\nStock akan dikirimkan sebentar lagi.`
                                            )
                                            await message.edit({ embeds: [embed], components: [], files: [] }).catch(e => console.error(`[Payment Monitor] Failed to edit DM success: ${e.message}`))
                                        } else if (result.status === 'expired' || result.status?.includes('expired')) {
                                            const embed = errorEmbed(
                                                'Pembayaran Kedaluwarsa',
                                                `Mohon maaf, waktu pembayaran untuk order **${trx.orderId}** telah habis.`
                                            )
                                            await message.edit({ embeds: [embed], components: [], files: [] }).catch(e => console.error(`[Payment Monitor] Failed to edit DM expired: ${e.message}`))
                                        }
                                    }
                                }
                            }
                        } catch (dmError) {
                            console.error(`[Payment Monitor] Error collecting DM for ${trx.orderId}:`, dmError)
                        }
                    }
                }
            } catch (err) {
                console.error(`[Payment Monitor] Error syncing ${trx.orderId}:`, err)
            }
            // Small delay between API calls
            await new Promise(resolve => setTimeout(resolve, 200))
        }
    } catch (error) {
        console.error('[Payment Monitor] Sync Error:', error)
    }
}


async function checkPendingTransactions(client: ExtendedClient) {
    const now = new Date()

    // Find pending transactions that have expired
    const expiredTxs = await db.select({
        id: transactions.id,
        orderId: transactions.orderId,
        userId: transactions.userId,
        dmMessageId: transactions.dmMessageId,
        expiredAt: transactions.expiredAt
    })
        .from(transactions)
        .where(eq(transactions.status, 'pending'))

    // Import required tables
    const { stocks, transactionQueues } = await import('@/lib/db/schema')
    const { inArray } = await import('drizzle-orm')

    for (const tx of expiredTxs) {
        if (tx.expiredAt && now > tx.expiredAt) {
            console.log(`[Payment Monitor] Order ${tx.orderId} expired. Cleaning up...`)

            try {
                // Get queued stocks for this transaction
                const queuedStocks = await db.select({ stockId: transactionQueues.stockId })
                    .from(transactionQueues)
                    .where(eq(transactionQueues.transactionId, tx.id))

                const stockIds = queuedStocks.map(s => s.stockId)

                // Update DB in transaction
                await db.transaction(async (dbTx) => {
                    // 1. Update transaction status
                    await dbTx.update(transactions)
                        .set({ status: 'expired' })
                        .where(eq(transactions.id, tx.id))

                    // 2. Release reserved stocks back to ready
                    if (stockIds.length > 0) {
                        await dbTx.update(stocks)
                            .set({ status: 'ready', soldTo: null })
                            .where(inArray(stocks.id, stockIds))
                    }

                    // 3. Delete from queue
                    await dbTx.delete(transactionQueues)
                        .where(eq(transactionQueues.transactionId, tx.id))
                })

                console.log(`[Payment Monitor] Order ${tx.orderId} expired. Released ${stockIds.length} stocks.`)
            } catch (err) {
                console.error(`[Payment Monitor] Error expiring ${tx.orderId}:`, err)
            }

            // Update DM
            await updateDMStatus(client, tx.userId, tx.dmMessageId, 'expired', tx.orderId)
        }
    }
}


async function checkCompletedTransactions(client: ExtendedClient) {
    // Find success transactions that haven't been notified (Web or Bot)
    const successTxs = await db.select({
        id: transactions.id,
        orderId: transactions.orderId,
        userId: transactions.userId,
        dmMessageId: transactions.dmMessageId,
        assignedStocks: transactions.assignedStocks,
        productName: products.name,
        price: transactions.price,
        paymentMethod: transactions.paymentMethod,
        quantity: transactions.quantity,
    })
        .from(transactions)
        .leftJoin(products, eq(transactions.productId, products.id))
        .where(and(
            eq(transactions.status, 'success'),
            eq(transactions.isNotified, false)
        ))

    // Import users table & NotificationSystem
    const { users } = await import('@/lib/db/schema')
    const { NotificationSystem } = await import('./NotificationSystem')
    const GUILD_ID = process.env.DISCORD_GUILD_ID || ''

    for (const tx of successTxs) {
        console.log(`[Payment Monitor] Order ${tx.orderId} success. Processing notifications...`)

        let discordUser = null
        if (tx.userId) {
            const dbUser = await db.query.users.findFirst({
                where: eq(users.id, tx.userId)
            })
            if (dbUser && dbUser.discordId) {
                discordUser = await client.users.fetch(dbUser.discordId).catch(() => null)
            }
        }

        // --- 1. Channel Notifications (Public & Private) ---
        // Prepare Stock Content
        let stockContent = ''
        if (tx.assignedStocks) {
            try {
                const parsed = JSON.parse(tx.assignedStocks)
                stockContent = Array.isArray(parsed) ? parsed.join('\n') : String(tx.assignedStocks)
            } catch {
                stockContent = String(tx.assignedStocks)
            }
        }

        const notificationSent = await NotificationSystem.sendSuccessLog(client, {
            user: discordUser || { username: 'Guest/Web User', displayAvatarURL: () => null, toString: () => 'Guest' },
            productName: tx.productName || 'Unknown Product',
            quantity: tx.quantity,
            price: Number(tx.price),
            method: tx.paymentMethod,
            transactionId: tx.orderId!,
            stockContent: stockContent
        }, GUILD_ID)

        // --- 2. DM Notification (Only if Discord User exists) ---
        try {
            if (discordUser) {
                // Delete old QR message if exists (Bot flow)
                if (tx.dmMessageId) {
                    try {
                        const dmChannel = await discordUser.createDM().catch(() => null)
                        if (dmChannel) {
                            const oldMessage = await dmChannel.messages.fetch(tx.dmMessageId).catch(() => null)
                            if (oldMessage) await oldMessage.delete().catch(() => null)
                        }
                    } catch { }
                }

                // Prepare stock file
                let attachment: AttachmentBuilder | null = null
                if (stockContent) {
                    const buffer = Buffer.from(stockContent, 'utf-8')
                    attachment = new AttachmentBuilder(buffer, { name: `order-${tx.orderId}.txt` })
                }

                // Send DM
                const embed = successEmbed('Pembelian Berhasil',
                    attachment
                        ? `Terima kasih telah berbelanja **${tx.productName || 'Produk'}**!\n\nPembayaran Anda telah kami terima.\nSilakan unduh file di bawah ini untuk melihat kode pesanan Anda.\n\n**Order ID:** ${tx.orderId}`
                        : `Terima kasih telah berbelanja **${tx.productName || 'Produk'}**!\n\nPembayaran Anda telah kami terima.\n\n**Order ID:** ${tx.orderId}`
                )

                const sendOptions: any = { embeds: [embed] }
                if (attachment) sendOptions.files = [attachment]

                await discordUser.send(sendOptions).catch(e => console.warn(`[Payment Monitor] Failed to DM user: ${e.message}`))
            }
        } catch (err) {
            console.error(`[Payment Monitor] DM Logic Error for ${tx.orderId}:`, err)
        }

        // --- 3. Mark as notified ONLY if channel notification was successful ---
        if (notificationSent) {
            await db.update(transactions)
                .set({ isNotified: true })
                .where(eq(transactions.id, tx.id))
            console.log(`[Payment Monitor] ✅ Order ${tx.orderId} marked as notified`)
        } else {
            console.warn(`[Payment Monitor] ⚠️ Order ${tx.orderId} notification failed, will retry next cycle`)
        }
    }
}



async function updateDMStatus(
    client: ExtendedClient,
    userId: number | null,
    messageId: string | null,
    status: 'success' | 'expired',
    orderId?: string | null,
    productName?: string
): Promise<boolean> {
    if (!userId || !messageId) return false

    try {
        // Find Discord ID from DB User
        const { users } = await import('@/lib/db/schema')
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        })

        if (!user || !user.discordId) return false

        const discordUser = await client.users.fetch(user.discordId).catch(() => null)
        if (!discordUser) return false

        const dmChannel = await discordUser.createDM().catch(() => null)
        if (!dmChannel) return false

        const message = await dmChannel.messages.fetch(messageId).catch(() => null)
        if (!message) return false

        if (status === 'expired') {
            const embed = createEmbed({
                title: '❌ Pembayaran Kadaluarsa',
                description: `Maaf, waktu pembayaran untuk Order **${orderId}** telah habis.`,
                color: 0xFF0000,
                footer: 'Silakan buat pesanan baru jika ingin melanjutkan.'
            })
            await message.edit({ embeds: [embed], components: [], files: [] }).catch(() => null)
        } else if (status === 'success') {
            const embed = successEmbed('Pembelian Berhasil',
                `Terima kasih telah berbelanja **${productName || 'Produk'}**!\n\nPembayaran Anda telah kami terima.\n\n**Order ID:** ${orderId}`)
            await message.edit({ embeds: [embed], components: [], files: [] }).catch(() => null)
        }

        return true
    } catch (error) {
        console.error(`[Payment Monitor] Error updating DM ${messageId}:`, error)
        return false
    }
}

// ============================================================================
// DEPOSIT MONITORING
// ============================================================================

async function syncPendingDeposits(client: ExtendedClient) {
    try {
        const { deposits } = await import('@/lib/db/schema')
        const { processSingleDeposit } = await import('@/lib/services/sync-service')

        const pendingDeposits = await db.select()
            .from(deposits)
            .where(eq(deposits.status, 'pending'))

        for (const deposit of pendingDeposits) {
            const result = await processSingleDeposit(deposit)

            if (result.updated && result.status === 'success') {
                console.log(`[Payment Monitor] Deposit ${deposit.refId} SUCCESS via sync.`)
                // Don't send notification here - let checkCompletedDeposits handle it
            }
        }

        // Check for completed deposits that need notification
        await checkCompletedDeposits(client)

    } catch (error) {
        console.error('[Payment Monitor] Sync Pending Deposits Error:', error)
    }
}

async function checkCompletedDeposits(client: ExtendedClient) {
    try {
        const { deposits, users } = await import('@/lib/db/schema')
        const { NotificationSystem } = await import('./NotificationSystem')

        // Find success deposits that haven't been notified
        const successDeposits = await db.select({
            id: deposits.id,
            userId: deposits.userId,
            amount: deposits.amount,
            refId: deposits.refId,
            paymentChannel: deposits.paymentChannel,
            isNotified: deposits.isNotified
        })
            .from(deposits)
            .where(and(
                eq(deposits.status, 'success'),
                eq(deposits.isNotified, false)
            ))

        for (const deposit of successDeposits) {
            console.log(`[Payment Monitor] Deposit ${deposit.refId} success. Processing notifications...`)

            let discordUser = null
            if (deposit.userId) {
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.id, deposit.userId),
                    columns: { discordId: true, username: true }
                })
                if (dbUser && dbUser.discordId) {
                    discordUser = await client.users.fetch(dbUser.discordId).catch(() => null)
                }
            }

            // --- 1. Channel Notification (Public & Private) ---
            const notificationSent = await NotificationSystem.sendDepositSuccessLog(client, {
                user: discordUser || { username: 'Guest/Web User', displayAvatarURL: () => null, toString: () => 'Guest' },
                amount: parseFloat(deposit.amount),
                refId: deposit.refId || 'N/A',
                method: deposit.paymentChannel || 'QRIS'
            })

            // --- 2. DM Notification ---
            if (discordUser) {
                const embed = successEmbed('Topup Berhasil! 💎',
                    `Saldo sebesar **Rp ${parseFloat(deposit.amount).toLocaleString('id-ID')}** telah ditambahkan ke akun Anda.\nRef ID: \`${deposit.refId}\`\n\n*Status diperbarui oleh sistem monitoring.*`
                )
                await discordUser.send({ embeds: [embed] }).catch(() => { })
            }

            // --- 3. Mark as notified ONLY if channel notification was successful ---
            if (notificationSent) {
                await db.update(deposits)
                    .set({ isNotified: true })
                    .where(eq(deposits.id, deposit.id))
                console.log(`[Payment Monitor] ✅ Deposit ${deposit.refId} marked as notified`)
            } else {
                console.warn(`[Payment Monitor] ⚠️ Deposit ${deposit.refId} notification failed, will retry next cycle`)
            }
        }

    } catch (error) {
        console.error('[Payment Monitor] Check Completed Deposits Error:', error)
    }
}
