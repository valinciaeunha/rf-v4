
import { Client, EmbedBuilder, AttachmentBuilder } from 'discord.js'
import { db } from '@/lib/db'
import { botSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { BOT_CONFIG } from '../types'

interface SUCCESS_LOG_DATA {
    user: any // Discord User Object
    productName: string
    quantity: number
    price: number
    method: string
    transactionId: string
    stockContent?: string
}

interface EXPIRED_LOG_DATA {
    username: string
    productName: string
    quantity: number
    refId: string
    reason?: string
}

export class NotificationSystem {

    /**
     * Send Success Log to Public (Censored) and Private (Full) Channels
     */
    static async sendSuccessLog(client: Client, data: SUCCESS_LOG_DATA, guildId?: string) {
        try {
            // Fetch Settings (no guildId filter - supports multi-server channels)
            const settings = await db.query.botSettings.findFirst()

            if (!settings) {
                console.warn('[NotificationSystem] No bot settings found in database')
                return
            }

            const publicChannels = settings.publicLogChannelId ? settings.publicLogChannelId.split(',').map(id => id.trim()) : []
            const privateChannels = settings.privateLogChannelId ? settings.privateLogChannelId.split(',').map(id => id.trim()) : []

            // --- Helper Create Embed ---
            const createEmbed = (isPublic: boolean) => {
                const embed = new EmbedBuilder()
                    .setTitle('Pembelian Baru! 🎉')
                    .setColor(BOT_CONFIG.color) // Greenish
                    .setThumbnail(data.user?.displayAvatarURL?.() || null)
                    .addFields(
                        { name: 'Pembeli', value: `${data.user} (${data.user.username})`, inline: true },
                        { name: 'Produk', value: data.productName, inline: true },
                        { name: 'Jumlah', value: `${data.quantity} item`, inline: true },
                        { name: 'Harga', value: `Rp ${data.price.toLocaleString('id-ID')}`, inline: true },
                        { name: 'Metode', value: data.method, inline: true }
                    )
                    .setFooter({ text: 'Terima kasih telah berbelanja!' })
                    .setTimestamp()

                // Censorship for Public
                let txIdDisplay = `\`${data.transactionId}\``
                if (isPublic) {
                    if (data.transactionId.length > 8) {
                        const prefix = data.transactionId.substring(0, 6)
                        txIdDisplay = `\`${prefix}xxxxx\``
                    } else {
                        txIdDisplay = `\`xxxxx\``
                    }
                }
                embed.addFields({ name: 'Transaction ID', value: txIdDisplay, inline: false })
                embed.addFields({ name: 'Tanggal', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false })

                return embed
            }

            // 1. Send to Public Channels
            for (const channelId of publicChannels) {
                if (!channelId) continue
                const channel = await client.channels.fetch(channelId).catch(() => null)
                if (channel && channel.isTextBased() && 'send' in channel) {
                    await (channel as any).send({ embeds: [createEmbed(true)] })
                        .then(() => console.log(`[NotificationSystem] ✅ Sent public log to ${channelId}`))
                        .catch((e: any) => console.warn(`[NotificationSystem] ❌ Failed public log to ${channelId}:`, e.message))
                } else {
                    console.warn(`[NotificationSystem] Channel ${channelId} not found or not text-based`)
                }
            }

            // 2. Send to Private Channels (With Stock)
            for (const channelId of privateChannels) {
                if (!channelId) continue
                const channel = await client.channels.fetch(channelId).catch(() => null)
                if (channel && channel.isTextBased() && 'send' in channel) {
                    const embeds = []
                    const mainEmbed = createEmbed(false) // Not censored

                    // Stock Splitting Logic
                    if (data.stockContent) {
                        const stockLines = data.stockContent.split('\n')
                        const ITEMS_PER_EMBED = 20 // Keep it safe

                        if (stockLines.length <= ITEMS_PER_EMBED) {
                            mainEmbed.addFields({
                                name: '📄 Data Stok',
                                value: `\`\`\`\n${data.stockContent}\`\`\``,
                                inline: false
                            })
                            embeds.push(mainEmbed)
                        } else {
                            embeds.push(mainEmbed)
                            const chunks = []
                            for (let i = 0; i < stockLines.length; i += ITEMS_PER_EMBED) {
                                chunks.push(stockLines.slice(i, i + ITEMS_PER_EMBED))
                            }

                            for (let i = 0; i < chunks.length; i++) {
                                const stockEmbed = new EmbedBuilder()
                                    .setColor(BOT_CONFIG.color)
                                    .setTitle(`📄 Data Stok (${i + 1}/${chunks.length})`)
                                    .setDescription(`\`\`\`\n${chunks[i].join('\n')}\`\`\``)
                                    .setTimestamp()
                                embeds.push(stockEmbed)
                            }
                        }
                    } else {
                        embeds.push(mainEmbed)
                    }

                    // Send (Max 10 embeds per message)
                    await (channel as any).send({ embeds: embeds.slice(0, 10) })
                        .then(() => console.log(`[NotificationSystem] ✅ Sent private log to ${channelId}`))
                        .catch((e: any) => console.warn(`[NotificationSystem] ❌ Failed private log to ${channelId}:`, e.message))
                } else {
                    console.warn(`[NotificationSystem] Private channel ${channelId} not found or not text-based`)
                }
            }

        } catch (error) {
            console.error('[NotificationSystem] Public/Private Log Error:', error)
        }
    }

    /**
     * Send Expired Log
     */
    static async sendExpiredLog(client: Client, data: EXPIRED_LOG_DATA, guildId?: string) {
        try {
            // Fetch Settings (no guildId filter - supports multi-server channels)
            const settings = await db.query.botSettings.findFirst()

            if (!settings || !settings.expiredLogChannelId) {
                console.warn('[NotificationSystem] No bot settings or expired channel found')
                return
            }

            const channelId = settings.expiredLogChannelId
            const channel = await client.channels.fetch(channelId).catch(() => null)

            if (channel && channel.isTextBased() && 'send' in channel) {
                const embed = new EmbedBuilder()
                    .setTitle('Transaksi Expired / Timeout ❌')
                    .setColor(0xEF4444) // Red
                    .addFields(
                        { name: 'Pembeli', value: data.username, inline: true }, // Might be guest
                        { name: 'Produk', value: data.productName, inline: true },
                        { name: 'Jumlah', value: `${data.quantity} item`, inline: true },
                        { name: 'Ref ID', value: `\`${data.refId}\``, inline: true },
                        { name: 'Alasan', value: data.reason || 'Waktu Habis', inline: false },
                        { name: 'Tanggal', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setTimestamp()

                await (channel as any).send({ embeds: [embed] })
            }
        } catch (error) {
            console.error('[NotificationSystem] Expired Log Error:', error)
        }
    }
}
