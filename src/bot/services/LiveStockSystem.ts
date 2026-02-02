
import { Client, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { db } from '@/lib/db'
import { liveMessages, products, stocks, users, transactions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { formatCurrency } from '../utils'
import { BOT_CONFIG } from '../types'

const UPDATE_INTERVAL_MS = 20000 // 20 seconds
const MAX_FAIL_COUNT = 5

export class LiveStockSystem {
    private static interval: NodeJS.Timeout | null = null
    private static isUpdating = false

    static async start(client: Client) {
        if (this.interval) clearInterval(this.interval)

        console.log('[LiveStock] System started.')

        // Run immediately
        this.runUpdateCycle(client)

        // Schedule interval
        this.interval = setInterval(() => {
            this.runUpdateCycle(client)
        }, UPDATE_INTERVAL_MS)
    }

    static stop() {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
            console.log('[LiveStock] System stopped.')
        }
    }

    static async registerMessage(guildId: string, channelId: string, messageId: string) {
        try {
            await db.insert(liveMessages).values({
                guildId,
                channelId,
                messageId,
                failCount: 0
            }).onConflictDoNothing()
            console.log(`[LiveStock] Registered message: ${messageId}`)
        } catch (error) {
            console.error('[LiveStock] Failed to register message:', error)
        }
    }

    private static async runUpdateCycle(client: Client) {
        if (this.isUpdating) return
        this.isUpdating = true

        try {
            await this.updateAllMessages(client)
        } catch (error) {
            console.error('[LiveStock] Update cycle error:', error)
        } finally {
            this.isUpdating = false
        }
    }

    private static async updateAllMessages(client: Client) {
        const messages = await db.select().from(liveMessages)
        if (messages.length === 0) return

        // 1. Generate Content (Shared for all messages)
        const contentData = await this.generateProductView()

        for (const msgData of messages) {
            try {
                const guild = await client.guilds.fetch(msgData.guildId).catch(() => null)
                if (!guild) throw new Error('Guild not found')

                const channel = await guild.channels.fetch(msgData.channelId).catch(() => null) as TextChannel
                if (!channel) throw new Error('Channel not found')

                const message = await channel.messages.fetch(msgData.messageId).catch(() => null)
                if (!message) {
                    // Message deleted? Increment fail count
                    throw new Error('Message not found')
                }

                // Edit Message
                await message.edit({
                    embeds: contentData.embeds,
                    components: contentData.components
                })

                // Reset fail count if successful
                if (msgData.failCount > 0) {
                    await db.update(liveMessages)
                        .set({ failCount: 0 })
                        .where(eq(liveMessages.id, msgData.id))
                }

                // Update Channel Name
                await this.updateChannelName(channel, contentData.totalStock)

            } catch (error: any) {
                console.warn(`[LiveStock] Failed to update ${msgData.messageId}: ${error.message}`)

                // Increment Fail Count
                const newFailCount = msgData.failCount + 1
                if (newFailCount >= MAX_FAIL_COUNT) {
                    await db.delete(liveMessages).where(eq(liveMessages.id, msgData.id))
                    console.log(`[LiveStock] Removed message ${msgData.messageId} after max failures.`)
                } else {
                    await db.update(liveMessages)
                        .set({ failCount: newFailCount })
                        .where(eq(liveMessages.id, msgData.id))
                }
            }

            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    private static async updateChannelName(channel: TextChannel, totalStock: number) {
        try {
            const currentName = channel.name
            // Remove existing prefix if any
            const cleanName = currentName.replace(/^[🔴🟢\s\-|┃]+/, '')

            const newPrefix = (totalStock > 0) ? '🟢┃' : '🔴┃'
            const hasIndicator = /^[🔴🟢]/.test(currentName)

            // Only update if it already had an indicator OR we want to force it?
            // Bot-store-v2 logic: "if (hasIndicator)"
            // User request: "secara otomatis menganti nama channel id dengan simbol merah 🟢┃ 🔴┃"
            // I'll assume we enforce it if it looks like a stock channel or just prepend.
            // Safest: Update if prefix changes OR doesn't exist yet but user registered it?
            // Let's stick to reference: Update if it has indicator. 
            // BUT, user might want it to START having indicator.
            // Let's Try: Always prepend if clean name is found.

            const newName = `${newPrefix}${cleanName}`

            if (currentName !== newName) {
                await channel.setName(newName)
                console.log(`[LiveStock] Channel renamed: ${newName}`)
            }
        } catch (error: any) {
            // Ignore rate limits or permission errors
            if (!error.message.includes('Rate limit')) {
                console.warn(`[LiveStock] Channel rename failed: ${error.message}`)
            }
        }
    }

    private static async generateProductView() {
        // Fetch products
        const productList = await db
            .select({
                id: products.id,
                productId: products.productId,
                name: products.name,
                price: products.price,
                status: products.status,
            })
            .from(products)
            .where(eq(products.status, 'active'))
            .orderBy(products.id)

        // Get stock counts
        const stockCounts = await db
            .select({
                productId: stocks.productId,
                readyCount: sql<number>`COUNT(CASE WHEN ${stocks.status} = 'ready' THEN 1 END)`.as('ready_count'),
                soldCount: sql<number>`COUNT(CASE WHEN ${stocks.status} = 'sold' THEN 1 END)`.as('sold_count'),
            })
            .from(stocks)
            .groupBy(stocks.productId)

        const stockMap = new Map(
            stockCounts.map(s => [s.productId, { ready: Number(s.readyCount), sold: Number(s.soldCount) }])
        )

        // Fetch global stats
        const globalStats = await db
            .select({
                totalUsers: sql<number>`(SELECT count(*) FROM users)`,
                totalTransactions: sql<number>`(SELECT count(*) FROM transactions WHERE status = 'success')`,
                pendingTransactions: sql<number>`(SELECT count(*) FROM transactions WHERE status = 'pending')`
            })
            .from(users)
            .limit(1)

        const totalUsers = Number(globalStats[0]?.totalUsers || 0)
        const totalTrx = Number(globalStats[0]?.totalTransactions || 0)
        const pendingTrx = Number(globalStats[0]?.pendingTransactions || 0)

        let description = ''
        let totalReadyStock = 0

        productList.forEach((product) => {
            const stockInfo = stockMap.get(product.id) || { ready: 0, sold: 0 }
            totalReadyStock += stockInfo.ready

            description += `** ${product.name.toUpperCase()}**\n`
            description += `Harga: ** ${formatCurrency(product.price)}**\n`
            description += `Stok Ready: ** ${stockInfo.ready}**\n`
            description += `Terjual: ** ${stockInfo.sold}**\n`
            description += `━━━━━━━━━━━━━━━━━━━━\n\n`
        })

        const embed = new EmbedBuilder()
            .setTitle('KATALOG PRODUK')
            .setDescription(description || 'Belum ada produk yang tersedia.')
            .setColor(BOT_CONFIG.color)
            .setTimestamp()
            .setFooter({ text: `Total User: ${totalUsers.toLocaleString()} | Sukses: ${totalTrx.toLocaleString()} | Pending: ${pendingTrx.toLocaleString()}` })

        // Re-use buttons from show command logic
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_buy_product')
                .setLabel('Beli')
                .setEmoji('<:troli:1467178505950462219>')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('btn_topup')
                .setLabel('Topup')
                .setEmoji('<:diamond:1467178851321778267>')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('btn_history')
                .setLabel('Riwayat')
                .setEmoji('<:not:1467179288884281364>')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('btn_info')
                .setLabel('Info')
                .setEmoji('<:info:1467179543398842461>')
                .setStyle(ButtonStyle.Secondary)
        )

        return {
            embeds: [embed],
            components: [row],
            totalStock: totalReadyStock
        }
    }
}
