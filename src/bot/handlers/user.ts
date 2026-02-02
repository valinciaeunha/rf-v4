import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder, MessageFlags } from 'discord.js'
import { db } from '@/lib/db'
import { users, transactions, deposits, products } from '@/lib/db/schema'
import { eq, and, count, desc } from 'drizzle-orm'
import { createEmbed, formatCurrency, errorEmbed, formatDate, infoEmbed } from '../utils'
import { BOT_CONFIG } from '../types'

export async function handleInfoButton(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
        const discordId = interaction.user.id

        // 1. Get User
        const user = await db.query.users.findFirst({
            where: eq(users.discordId, discordId)
        })

        if (!user) {
            await interaction.editReply({
                embeds: [errorEmbed('User Tidak Ditemukan', 'Akun kamu belum terdaftar di sistem kami. Silakan lakukan transaksi pertama atau hubungi admin.')]
            })
            return
        }

        // 2. Get Transaction Stats
        const [trxTotalResult] = await db.select({ count: count() }).from(transactions).where(eq(transactions.userId, user.id))
        const [trxSuccessResult] = await db.select({ count: count() }).from(transactions).where(and(eq(transactions.userId, user.id), eq(transactions.status, 'success')))

        const trxTotal = trxTotalResult.count
        const trxSuccess = trxSuccessResult.count
        const trxRate = trxTotal > 0 ? (trxSuccess / trxTotal) * 100 : 0

        // 3. Get Deposit Stats
        const [depoTotalResult] = await db.select({ count: count() }).from(deposits).where(eq(deposits.userId, user.id))
        const [depoSuccessResult] = await db.select({ count: count() }).from(deposits).where(and(eq(deposits.userId, user.id), eq(deposits.status, 'success')))

        const depoTotal = depoTotalResult.count
        const depoSuccess = depoSuccessResult.count
        const depoRate = depoTotal > 0 ? (depoSuccess / depoTotal) * 100 : 0

        // 4. Create Embed
        const embed = createEmbed({
            title: `<:profile:1467188199096061952> Informasi Akun: ${user.username}`,
            color: BOT_CONFIG.color,
            thumbnail: interaction.user.displayAvatarURL(),
            description: `Halo **${interaction.user.username}**, berikut adalah statistik akun kamu.`,
            fields: [
                {
                    name: `${BOT_CONFIG.emojis.money} Saldo Aktif`,
                    value: `**${formatCurrency(user.balance)}**`,
                    inline: false
                },
                {
                    name: '<:chart:1467431266440843434> Statistik Transaksi',
                    value: [
                        `Total: **${trxTotal}**`,
                        `Sukses: **${trxSuccess}**`,
                        `Success Rate: **${trxRate.toFixed(1)}%**`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '<:credit_card:1467183960198218014> Statistik Deposit',
                    value: [
                        `Total: **${depoTotal}**`,
                        `Sukses: **${depoSuccess}**`,
                        `Success Rate: **${depoRate.toFixed(1)}%**`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '<:id:1467431264293486665> Info Lainnya',
                    value: [
                        `User ID: \`${user.id}\``,
                        `Discord ID: \`${discordId}\``,
                        `Role: \`${user.role}\``
                    ].join('\n'),
                    inline: false
                }
            ],
            footer: 'Redfinger Cloud Phone Indonesia',
            timestamp: true
        })

        await interaction.editReply({ embeds: [embed] })

    } catch (error) {
        console.error('[Bot Info] Error:', error)
        await interaction.editReply({
            embeds: [errorEmbed('Terjadi Kesalahan', 'Gagal memuat informasi akun.')]
        })
    }
}

export async function handleHistoryButton(interaction: ButtonInteraction) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_history_deposit')
            .setLabel('Riwayat Deposit')
            .setEmoji('<:credit_card:1467183960198218014>')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('btn_history_purchase')
            .setLabel('Riwayat Beli Produk')
            .setEmoji('<:troli:1467178505950462219>')
            .setStyle(ButtonStyle.Secondary)
    )

    await interaction.reply({
        embeds: [infoEmbed('Pilih Riwayat', 'Silakan pilih jenis riwayat yang ingin ditampilkan.')],
        components: [row],
        flags: MessageFlags.Ephemeral
    })
}

export async function handleHistoryDepositButton(interaction: ButtonInteraction) {
    await interaction.deferUpdate()

    try {
        const discordId = interaction.user.id
        const user = await db.query.users.findFirst({ where: eq(users.discordId, discordId) })

        if (!user) return

        const userDeposits = await db.query.deposits.findMany({
            where: eq(deposits.userId, user.id),
            orderBy: [desc(deposits.createdAt)],
            limit: 5
        })

        if (userDeposits.length === 0) {
            await interaction.followUp({
                embeds: [infoEmbed('Riwayat Deposit', 'Kamu belum melakukan deposit apapun.')],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const embed = createEmbed({
            title: '<:credit_card:1467183960198218014> 5 Riwayat Deposit Terakhir',
            color: BOT_CONFIG.color
        })

        userDeposits.forEach((d, i) => {
            const statusIcon = d.status === 'success' ? '<:check:1467191230642389084>' : d.status === 'pending' ? '<:jam_pasir:1467188461319491655>' : '<:cross:1467191230642389084>'
            embed.addFields({
                name: `#${i + 1} - ${formatCurrency(d.amount)}`,
                value: `ID: \`${d.trxId}\`\nStatus: ${statusIcon} **${d.status.toUpperCase()}**\nTanggal: ${formatDate(d.createdAt)}\nMetode: \`${d.paymentChannel}\``,
                inline: false
            })
        })

        await interaction.followUp({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        })

    } catch (error) {
        console.error('[Bot History] Error:', error)
        await interaction.followUp({ embeds: [errorEmbed('Error', 'Gagal memuat riwayat.')], flags: MessageFlags.Ephemeral })
    }
}

// Helper to get transaction detail
export async function handleTransactionDetailButton(interaction: ButtonInteraction) {
    // Expected customId: btn_trx_detail_ORDERID
    const orderId = interaction.customId.replace('btn_trx_detail_', '')
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
        // Use select + leftJoin to avoid relation issues
        const [transaction] = await db.select({
            id: transactions.id,
            orderId: transactions.orderId,
            price: transactions.price,
            quantity: transactions.quantity,
            status: transactions.status,
            createdAt: transactions.createdAt,
            assignedStocks: transactions.assignedStocks,
            productName: products.name
        })
            .from(transactions)
            .leftJoin(products, eq(transactions.productId, products.id))
            .where(eq(transactions.orderId, orderId))
            .limit(1)

        if (!transaction) {
            await interaction.editReply({ embeds: [errorEmbed('Not Found', 'Transaksi tidak ditemukan.')] })
            return
        }

        let stockListStr = ''
        let fileAttachment = null

        if (transaction.status === 'success' && transaction.assignedStocks) {
            try {
                const parsed = JSON.parse(transaction.assignedStocks)
                if (Array.isArray(parsed)) {
                    stockListStr = parsed.join('\n')
                } else {
                    stockListStr = String(transaction.assignedStocks)
                }
            } catch {
                stockListStr = String(transaction.assignedStocks)
            }

            if (stockListStr) {
                const buffer = Buffer.from(stockListStr, 'utf-8')
                fileAttachment = new AttachmentBuilder(buffer, { name: `stocks-${transaction.orderId}.txt` })
            }
        }

        const embed = createEmbed({
            title: `<:troli:1467178505950462219> Detail Transaksi`,
            color: BOT_CONFIG.color,
            description: `Detail pembelian **${transaction.productName || 'Unknown Product'}**`,
            fields: [
                { name: 'Order ID', value: `\`${transaction.orderId}\``, inline: true },
                { name: 'Tanggal', value: formatDate(transaction.createdAt), inline: true },
                { name: 'Harga', value: formatCurrency(transaction.price), inline: true },
                { name: 'Quantity', value: `**${transaction.quantity}x**`, inline: true },
                { name: 'Status', value: `**${transaction.status.toUpperCase()}**`, inline: true },
                { name: 'Data / SN', value: fileAttachment ? '📄 *Lihat file lampiran*' : (stockListStr ? `\`${stockListStr}\`` : '-'), inline: false }
            ],
            footer: 'Jika file tidak muncul, silakan cek DM pembelian awal.'
        })

        const replyOptions: any = { embeds: [embed] }
        if (fileAttachment) {
            replyOptions.files = [fileAttachment]
        }

        await interaction.editReply(replyOptions)

    } catch (error) {
        console.error('[Trx Detail] Error:', error)
        await interaction.editReply({ embeds: [errorEmbed('Error', 'Gagal memuat detail.')] })
    }
}

export async function handleHistoryPurchaseButton(interaction: ButtonInteraction) {
    // CustomID format: btn_history_purchase OR btn_history_purchase_page_2
    const isPageUpdate = interaction.customId.includes('_page_')

    if (isPageUpdate) {
        await interaction.deferUpdate()
    } else {
        // Initial call usually from "Menu" or "Back"
        await interaction.deferUpdate()
    }

    try {
        const discordId = interaction.user.id
        const user = await db.query.users.findFirst({ where: eq(users.discordId, discordId) })

        if (!user) return

        let page = 1
        if (interaction.customId.includes('_page_')) {
            const parts = interaction.customId.split('_page_')
            page = parseInt(parts[1]) || 1
        }

        const limit = 5
        const offset = (page - 1) * limit

        // Fetch paginated transactions
        const [totalCountResult] = await db.select({ count: count() })
            .from(transactions)
            .where(eq(transactions.userId, user.id))

        const totalItems = totalCountResult.count
        const totalPages = Math.ceil(totalItems / limit)

        const userTrx = await db.select({
            id: transactions.id,
            orderId: transactions.orderId,
            productName: products.name,
            price: transactions.price,
            status: transactions.status,
            createdAt: transactions.createdAt,
            sn: transactions.assignedStocks
        })
            .from(transactions)
            .leftJoin(products, eq(transactions.productId, products.id))
            .where(eq(transactions.userId, user.id))
            .orderBy(desc(transactions.createdAt))
            .limit(limit)
            .offset(offset)

        if (userTrx.length === 0) {
            const emptyEmbed = infoEmbed('Riwayat Pembelian', 'Kamu belum melakukan pembelian produk.')
            // If it was a page update (e.g. invalid page), handle gracefully? 
            // Usually won't happen if buttons are correct.
            if (isPageUpdate) {
                await interaction.followUp({ embeds: [emptyEmbed], flags: MessageFlags.Ephemeral })
            } else {
                await interaction.followUp({ embeds: [emptyEmbed], flags: MessageFlags.Ephemeral })
            }
            return
        }

        const embed = createEmbed({
            title: `<:troli:1467178505950462219> Riwayat Pembelian (Hal. ${page}/${totalPages})`,
            color: BOT_CONFIG.color,
            footer: 'Klik tombol angka di bawah untuk melihat detail lengkap.'
        })

        userTrx.forEach((t, i) => {
            const statusIcon = t.status === 'success' ? '<:check:1467191230642389084>' : t.status === 'pending' ? '<:jam_pasir:1467188461319491655>' : '<:cross:1467191230642389084>'

            // Simplified list view
            embed.addFields({
                name: `#${i + 1} - ${t.productName || 'Unknown'}`,
                value: `ID: \`${t.orderId}\` | ${formatCurrency(t.price)}\n${statusIcon} **${t.status.toUpperCase()}** | ${formatDate(t.createdAt)}`,
                inline: false
            })
        })

        // --- BUTTONS ---
        const components: ActionRowBuilder<ButtonBuilder>[] = []

        // Row 1: Item Buttons (1-5)
        const itemRow = new ActionRowBuilder<ButtonBuilder>()
        userTrx.forEach((t, i) => {
            itemRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`btn_trx_detail_${t.orderId}`)
                    .setLabel(`${i + 1}`)
                    .setStyle(ButtonStyle.Secondary)
            )
        })
        components.push(itemRow)

        // Row 2: Navigation (Prev, Next)
        const navRow = new ActionRowBuilder<ButtonBuilder>()

        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_history_purchase_page_${page - 1}`)
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page <= 1)
        )

        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_history_purchase_page_${page + 1}`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page >= totalPages)
        )

        components.push(navRow)

        await interaction.editReply({
            embeds: [embed],
            components: components
        })

    } catch (error) {
        console.error('[Bot History] Error:', error)
        await interaction.followUp({ embeds: [errorEmbed('Error', 'Gagal memuat riwayat.')], ephemeral: true })
    }
}
