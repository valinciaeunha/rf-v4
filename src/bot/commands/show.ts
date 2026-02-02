import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js'
import { BotCommand, BOT_CONFIG } from '../types'
import { createEmbed, formatCurrency } from '../utils'
import { db } from '@/lib/db'
import { products, stocks, users, transactions } from '@/lib/db/schema'
import { eq, count, sql } from 'drizzle-orm'

// Owner IDs - set this in environment (comma separated)
const OWNER_IDS = (process.env.DISCORD_OWNER_ID || '').split(',').map(id => id.trim())

const showCommand: BotCommand = {
    data: new SlashCommandBuilder()
        .setName('show')
        .setDescription('Menampilkan daftar produk LIVE (Owner Only)'),

    async execute(interaction: ChatInputCommandInteraction) {
        // Check owner only
        if (OWNER_IDS.length > 0 && !OWNER_IDS.includes(interaction.user.id)) {
            await interaction.reply({
                embeds: [createEmbed({
                    title: '❌ Akses Ditolak',
                    description: 'Command ini hanya bisa digunakan oleh owner.',
                    color: 0xEF4444
                })],
                ephemeral: true
            })
            return
        }

        await interaction.deferReply()

        try {
            // Fetch products with stock counts
            const productList = await db
                .select({
                    id: products.id,
                    productId: products.productId,
                    name: products.name,
                    price: products.price,
                    type: products.type,
                    badge: products.badge,
                    status: products.status,
                })
                .from(products)
                .where(eq(products.status, 'active'))
                .orderBy(products.id)

            if (productList.length === 0) {
                await interaction.editReply({
                    embeds: [createEmbed({
                        title: '📦 Katalog Produk',
                        description: 'Belum ada produk yang tersedia saat ini. 🥺',
                        color: 0xF59E0B
                    })]
                })
                return
            }

            // Get stock counts for each product
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
                    totalTransactions: sql<number>`(SELECT count(*) FROM transactions)`
                })
                .from(users) // Use table object instead of sql helper for main table
                .limit(1)

            const totalUsers = Number(globalStats[0]?.totalUsers || 0)
            const totalTrx = Number(globalStats[0]?.totalTransactions || 0)

            // Build description with Cleaner Style
            let description = ''

            productList.forEach((product) => {
                const stockInfo = stockMap.get(product.id) || { ready: 0, sold: 0 }

                description += `** ${product.name.toUpperCase()}**\n`
                description += `Harga: ** ${formatCurrency(product.price)}**\n`
                description += `Stok Ready: ** ${stockInfo.ready}**\n`
                description += `━━━━━━━━━━━━━━━━━━━━\n\n`
            })

            const embed = new EmbedBuilder()
                .setTitle('KATALOG PRODUK')
                .setDescription(description || 'Belum ada produk nih kak.')
                .setColor(BOT_CONFIG.color)
                .setTimestamp()
                .setFooter({ text: `Total User: ${totalUsers.toLocaleString()} | Total Transaksi: ${totalTrx.toLocaleString()} ` })

            // Build action buttons
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

            const message = await interaction.editReply({
                embeds: [embed],
                components: [row]
            })

            // Register message for auto-updates
            if (interaction.guildId && interaction.channelId) {
                const { LiveStockSystem } = await import('../services/LiveStockSystem')
                await LiveStockSystem.registerMessage(
                    interaction.guildId,
                    interaction.channelId,
                    message.id
                )
            }

        } catch (error) {
            console.error('[Show Command] Error:', error)
            await interaction.editReply({
                embeds: [createEmbed({
                    title: '❌ Error',
                    description: 'Terjadi kesalahan saat mengambil data produk.',
                    color: 0xEF4444
                })]
            })
        }
    }
}

export default showCommand
