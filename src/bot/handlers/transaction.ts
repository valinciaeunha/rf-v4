import { ActionRowBuilder, ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags, Message } from 'discord.js'
import { db } from '@/lib/db'
import { products, stocks, transactions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createEmbed, formatCurrency, errorEmbed, successEmbed } from '../utils'
import { createOrderInternal } from '@/lib/actions/orders'
import { BOT_CONFIG } from '../types'
import QRCode from 'qrcode'
import { PaymentSystem } from '@/bot/services/PaymentSystem'
import { PAYMENT_TIMEOUT_MINUTES } from '@/lib/payment-config'

// ============ 1. HANDLE BUY BUTTON CLICK ============
export async function handleBuyButton(interaction: ButtonInteraction) {
    try {
        // Fetch products
        const productList = await db
            .select({
                id: products.id,
                name: products.name,
                price: products.price,
                productId: products.productId
            })
            .from(products)
            .where(eq(products.status, 'active'))
            .orderBy(products.id)

        if (productList.length === 0) {
            await interaction.reply({
                embeds: [errorEmbed('Stok Kosong', 'Belum ada produk yang tersedia saat ini.')],
                ephemeral: true
            })
            return
        }

        // Get stock counts for all products first
        const stockCounts = await db
            .select({
                productId: stocks.productId,
                readyCount: sql<number>`COUNT(CASE WHEN ${stocks.status} = 'ready' THEN 1 END)`.as('ready_count')
            })
            .from(stocks)
            .groupBy(stocks.productId)

        const stockMap = new Map(
            stockCounts.map(s => [s.productId, Number(s.readyCount)])
        )

        // Create Select Menu Options
        const options = productList.map(p => {
            const stock = stockMap.get(p.id) || 0
            const price = new Intl.NumberFormat('en-US').format(Number(p.price)) // Format: 19,000

            return {
                label: p.name, // Use original casing
                description: `Rp ${price} | Stok: ${stock}`,
                value: p.id.toString(),
                // emoji: undefined // No emoji as requested
            }
        })

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_product_buy')
            .setPlaceholder('Pilih Produk yang mau dibeli...')
            .addOptions(options)

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu)

        await interaction.reply({
            content: 'Silakan pilih produk:',
            components: [row],
            ephemeral: true
        })

    } catch (error) {
        console.error('[Buy Button] Error:', error)
        await interaction.reply({
            embeds: [errorEmbed('Error', 'Gagal memuat daftar produk.')],
            ephemeral: true
        })
    }
}

// ============ 2. HANDLE PRODUCT SELECTION (SHOW DETAIL & CONFIRM) ============
export async function handleProductSelect(interaction: StringSelectMenuInteraction) {
    const productId = interaction.values[0]

    try {
        const product = await db.query.products.findFirst({
            where: eq(products.id, parseInt(productId))
        })

        if (!product) {
            await interaction.reply({
                embeds: [errorEmbed('Error', 'Produk tidak ditemukan.')],
                ephemeral: true
            })
            return
        }

        // Get live stock count
        const stockCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(stocks)
            .where(sql`${stocks.productId} = ${productId} AND ${stocks.status} = 'ready'`)

        const readyStock = Number(stockCount[0]?.count || 0)
        const price = formatCurrency(product.price)

        const embed = new EmbedBuilder()
            .setTitle(`Beli ${product.name}`)
            .setColor(0xEE98BB) // Match bot color
            .addFields(
                { name: '<:cash:1467183637274431742> Harga', value: price, inline: false },
                { name: '<:produk:1467183362518024436> Stok Tersedia', value: `${readyStock} item`, inline: false }
            )
            .setFooter({ text: 'Klik tombol di bawah untuk melanjutkan pembelian.' })

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_confirm_buy_${productId}`)
                .setLabel(readyStock > 0 ? 'Beli Sekarang' : 'Stok Habis')
                .setEmoji('<:troli:1467178505950462219>')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(readyStock === 0)
        )

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral
        })

    } catch (error) {
        console.error('[Select Product] Error:', error)
        if (!interaction.replied) {
            await interaction.reply({ embeds: [errorEmbed('Error', 'Terjadi kesalahan sistem.')], flags: MessageFlags.Ephemeral })
        }
    }
}

// ============ 3. HANDLE CONFIRM BUY BUTTON (SHOW MODAL) ============
export async function handleConfirmBuyButton(interaction: ButtonInteraction) {
    const customId = interaction.customId
    const productId = customId.replace('btn_confirm_buy_', '')

    try {
        const product = await db.query.products.findFirst({
            where: eq(products.id, parseInt(productId))
        })

        if (!product) return

        // Create Modal
        const modal = new ModalBuilder()
            .setCustomId(`modal_buy_${productId}`)
            .setTitle('Jumlah Pembelian')

        const quantityInput = new TextInputBuilder()
            .setCustomId('quantity')
            .setLabel("Mau beli berapa?")
            .setPlaceholder("Contoh: 1")
            .setValue("1")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput)

        modal.addComponents(row1)

        await interaction.showModal(modal)

    } catch (error) {
        console.error('[Confirm Buy] Error:', error)
    }
}

// ============ 4. HANDLE MODAL SUBMIT (SHOW INVOICE) ============
export async function handleBuyModalSubmit(interaction: ModalSubmitInteraction) {
    const customId = interaction.customId
    const productId = parseInt(customId.replace('modal_buy_', ''))

    const quantityStr = interaction.fields.getTextInputValue('quantity')
    const quantity = parseInt(quantityStr) || 1

    const discordUser = interaction.user

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
        // 1. Get Product & Stock
        const product = await db.query.products.findFirst({
            where: eq(products.id, productId)
        })

        if (!product) throw new Error('Produk tidak valid')

        const availableStock = await db
            .select({ count: sql<number>`count(*)` })
            .from(stocks)
            .where(sql`${stocks.productId} = ${productId} AND ${stocks.status} = 'ready'`)

        if (availableStock[0].count < quantity) {
            await interaction.editReply({
                embeds: [errorEmbed('Stok Tidak Cukup', `Maaf, stok ${product.name} tersisa ${availableStock[0].count} item.`)]
            })
            return
        }

        const totalPrice = Number(product.price) * quantity
        const qrisFee = Math.ceil(100 + totalPrice * 0.007) // QRIS Biasa: Rp100 + 0.70%
        const qrisRealtimeFee = Math.ceil(totalPrice * 0.017) // QRIS Realtime: 1.70%
        const totalQrisBiasa = totalPrice + qrisFee
        const totalQrisRealtime = totalPrice + qrisRealtimeFee

        // 2. Find or Create User
        const { getOrCreateUser } = await import('../utils/auto-register')
        const dbUser = await getOrCreateUser(discordUser)

        const currentBalance = Number(dbUser.balance)
        const isBalanceSufficient = currentBalance >= totalPrice

        // 3. Show Invoice & Payment Method
        const embed = new EmbedBuilder()
            .setTitle('🧾 Konfirmasi Pembayaran')
            .setColor(0xEE98BB) // Pink V2 Style
            .addFields(
                { name: '<:produk:1467183362518024436> Produk', value: `${product.name} (x${quantity})`, inline: false },
                { name: '<:cash:1467183637274431742> Subtotal', value: formatCurrency(totalPrice), inline: true },
                { name: '<:credit_card:1467183960198218014> Saldo Anda', value: formatCurrency(currentBalance), inline: true },
                { name: '\u200b', value: '\u200b', inline: false }, // Spacer
                { name: '💰 Saldo', value: formatCurrency(totalPrice), inline: true },
                { name: '<:qris:1467182897583882251> QRIS', value: formatCurrency(totalQrisBiasa), inline: true },
                { name: '⚡ QRIS RT', value: formatCurrency(totalQrisRealtime), inline: true }
            )
            .setFooter({ text: 'Pilih metode pembayaran di bawah.' })

        const btnPay = new ButtonBuilder()
            .setCustomId(`btn_pay_balance_${productId}_${quantity}`)
            .setLabel('Saldo')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:credit_card:1467183960198218014>')
            .setDisabled(!isBalanceSufficient) // Disable if balance not enough

        if (!isBalanceSufficient) {
            btnPay.setLabel('Saldo ❌')
        }

        const btnQris = new ButtonBuilder()
            .setCustomId(`btn_pay_qris_${productId}_${quantity}`)
            .setLabel('QRIS')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:qris:1467182897583882251>')

        const btnQrisRealtime = new ButtonBuilder()
            .setCustomId(`btn_pay_qrisrt_${productId}_${quantity}`)
            .setLabel('QRIS Realtime')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⚡')

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnPay, btnQris, btnQrisRealtime)

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        })


    } catch (error: any) {
        console.error('[Buy Modal] Error:', error)
        await interaction.editReply({
            embeds: [errorEmbed('Gagal Memproses', 'Terjadi kesalahan saat memproses pesanan.')]
        })
    }
}

// ============ 5. HANDLE PAY WITH BALANCE (PROCESS TRANSACTION) ============
export async function handlePayBalanceButton(interaction: ButtonInteraction) {
    const customId = interaction.customId
    const parts = customId.split('_')
    const quantity = parseInt(parts.pop() || '1')
    const productId = parseInt(parts.pop() || '0')
    const discordUser = interaction.user

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
        const { users } = await import('@/lib/db/schema')
        const dbUser = await db.query.users.findFirst({ where: eq(users.discordId, discordUser.id) })

        if (!dbUser) throw new Error('User tidak ditemukan')

        // Use the centralized createOrderInternal
        const result = await createOrderInternal({
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email
        }, {
            productId,
            quantity,
            paymentMethod: 'balance',
            email: dbUser.email
        })

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Gagal memproses pembayaran.')
        }

        const { data } = result
        const assignedCodes = data.assignedCodes || []

        // Delivery via DM
        try {
            const stockList = assignedCodes.join('\n')
            const buffer = Buffer.from(stockList, 'utf-8')
            const { AttachmentBuilder } = await import('discord.js')
            const attachment = new AttachmentBuilder(buffer, { name: `order-${data.orderId}.txt` })

            await discordUser.send({
                embeds: [
                    successEmbed('Pembelian Berhasil',
                        `Terima kasih telah berbelanja **${data.itemName || 'Produk'}**!\n\nSilakan unduh file di bawah ini untuk melihat kode pesanan Anda.\n\n**Order ID:** ${data.orderId}`)
                ],
                files: [attachment]
            })
        } catch (dmError) {
            console.error('Failed to DM user:', dmError)
        }

        // Reply to user
        const embed = successEmbed('Pembayaran Berhasil!',
            `Anda berhasil membeli **${data.itemName}** sebanyak **${quantity} item**.\nTotal: ${formatCurrency(data.totalBayar)}\n\n_Produk telah dikirim ke DM Anda._`)
            .setFooter({ text: `Order ID: ${data.orderId}` })

        await interaction.editReply({
            embeds: [embed],
            components: []
        })

    } catch (error: any) {
        console.error('[Pay Balance] Error:', error)
        const errorMessage = error.message || 'Gagal memproses pembayaran.'
        await interaction.editReply({ embeds: [errorEmbed('Gagal', errorMessage)] })
    }
}


// ============ 6. HANDLE PAY WITH QRIS ============
export async function handlePayQrisButton(interaction: any) { // Replace 'any' with ButtonInteraction
    const customId = interaction.customId
    const parts = customId.split('_')
    const quantity = parseInt(parts.pop() || '1')
    const productId = parseInt(parts.pop() || '0')
    const discordUser = interaction.user

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
        // 1. Find or Create User (Ensure DB user exists)
        // Reuse logic or import helper if available. 
        // For now, fast path: assume user exists because they passed the previous step (confirmation modal). 
        // But better safe.
        const { users } = await import('@/lib/db/schema')
        const dbUser = await db.query.users.findFirst({
            where: eq(users.discordId, discordUser.id)
        })

        if (!dbUser) {
            // Should verify user existence
            await interaction.editReply({ embeds: [errorEmbed('Error', 'Silakan ulangi proses dari awal.')] })
            return
        }

        // 2. Create Order

        const result = await createOrderInternal({
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email
        }, {
            productId,
            quantity,
            paymentMethod: 'qris', // Use plain qris
            email: dbUser.email,
            whatsappNumber: '-'
        })

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Gagal membuat pesanan.')
        }

        const { data } = result

        if (!data.qrString && !data.qrLink && !data.payUrl) {
            throw new Error('Gagal mendapatkan kode QR dari payment gateway.')
        }

        // Generate Local QR Code
        let attachment: AttachmentBuilder | null = null
        let imageUrl = data.qrLink // Fallback to provided link if any

        if (data.qrString) {
            const qrBuffer = await QRCode.toBuffer(data.qrString)
            attachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' })
            imageUrl = 'attachment://qrcode.png'
        }

        // Calculate expiration timestamp using env config
        const expirationTimestamp = Math.floor((Date.now() + (PAYMENT_TIMEOUT_MINUTES * 60000)) / 1000)

        const embed = createEmbed({
            title: '💳 Tagihan Pembayaran',
            description: `⏳ **Menunggu Pembayaran**\nSilakan scan QRIS di bawah ini ya kak!\n\n💡 *Setelah bayar, tunggu 10 detik - 1 menit ya kak~ 🙏*`,
            color: BOT_CONFIG.color,
            image: imageUrl,
            footer: 'Pembayaran otomatis dicek oleh sistem.'
        })

        // Add detail fields like bot-store-v2 with custom emojis
        embed.addFields(
            { name: `${BOT_CONFIG.emojis.product} Produk`, value: `${data.itemName || 'Item'} (x${quantity})`, inline: true },
            { name: `${BOT_CONFIG.emojis.money} Total Bayar`, value: formatCurrency(data.totalBayar), inline: true },
            { name: '🧾 Order ID', value: `\`${data.orderId}\``, inline: true },
            { name: `${BOT_CONFIG.emojis.loading} Berlaku Hingga`, value: `<t:${expirationTimestamp}:R>`, inline: true }
        )

        // Add Pay URL button if available (as backup)
        const row = new ActionRowBuilder<ButtonBuilder>()
        if (data.payUrl) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Buka Link Pembayaran')
                    .setStyle(ButtonStyle.Link)
                    .setURL(data.payUrl)
            )
        }

        const replyOptions: any = {
            embeds: [embed],
            components: row.components.length > 0 ? [row] : []
        }

        if (attachment) {
            replyOptions.files = [attachment]
        }

        // Show QR in channel (ephemeral) - Like bot-store-v2 pattern
        await interaction.editReply(replyOptions)

        // Also send to DM as backup
        let dmMessage: Message | null = null
        try {
            dmMessage = await discordUser.send(replyOptions)

            // Update transaction with dmMessageId
            await db.update(transactions)
                .set({ dmMessageId: dmMessage!.id })
                .where(eq(transactions.id, data.transactionId))
        } catch (dmError) {
            console.warn('[Pay QRIS] Failed to send DM (user may have DM disabled):', (dmError as Error).message)
        }

        // Start payment polling - will update channel + DM on success/expired
        PaymentSystem.startPolling(interaction, {
            transactionId: data.transactionId,
            orderId: data.orderId,
            productId: productId,
            productName: data.itemName || 'Produk',
            quantity: quantity,
            price: data.totalBayar, // Use totalBayar as price for display
            totalBayar: data.totalBayar,
            paymentMethod: 'qris',
            dmMessage: dmMessage
        })


    } catch (error: any) {
        console.error('[Pay QRIS] Error:', error)
        await interaction.editReply({ embeds: [errorEmbed('Gagal', error.message)] })
    }
}

// ============ 7. HANDLE PAY WITH QRIS REALTIME ============
export async function handlePayQrisRealtimeButton(interaction: any) {
    const customId = interaction.customId
    const parts = customId.split('_')
    const quantity = parseInt(parts.pop() || '1')
    const productId = parseInt(parts.pop() || '0')
    const discordUser = interaction.user

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
        const { users } = await import('@/lib/db/schema')
        const dbUser = await db.query.users.findFirst({
            where: eq(users.discordId, discordUser.id)
        })

        if (!dbUser) {
            await interaction.editReply({ embeds: [errorEmbed('Error', 'Silakan ulangi proses dari awal.')] })
            return
        }

        // Create Order with QRIS Realtime
        const result = await createOrderInternal({
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email
        }, {
            productId,
            quantity,
            paymentMethod: 'qris_realtime', // Use QRIS Realtime
            email: dbUser.email,
            whatsappNumber: '-'
        })

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Gagal membuat pesanan.')
        }

        const { data } = result

        if (!data.qrString && !data.qrLink && !data.payUrl) {
            throw new Error('Gagal mendapatkan kode QR dari payment gateway.')
        }

        // Generate Local QR Code
        let attachment: AttachmentBuilder | null = null
        let imageUrl = data.qrLink

        if (data.qrString) {
            const qrBuffer = await QRCode.toBuffer(data.qrString)
            attachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' })
            imageUrl = 'attachment://qrcode.png'
        }

        // Calculate expiration timestamp using env config
        const expirationTimestamp = Math.floor((Date.now() + (PAYMENT_TIMEOUT_MINUTES * 60000)) / 1000)

        const embed = createEmbed({
            title: '⚡ Tagihan Pembayaran (Realtime)',
            description: `⏳ **Menunggu Pembayaran**\nSilakan scan QRIS di bawah ini ya kak!\n\n💡 *Setelah bayar, tunggu 10 detik - 1 menit ya kak~ 🙏*`,
            color: BOT_CONFIG.color,
            image: imageUrl,
            footer: 'QRIS Realtime - Pembayaran otomatis dicek oleh sistem.'
        })

        // Add detail fields like bot-store-v2 with custom emojis
        embed.addFields(
            { name: `${BOT_CONFIG.emojis.product} Produk`, value: `${data.itemName || 'Item'} (x${quantity})`, inline: true },
            { name: `${BOT_CONFIG.emojis.money} Total Bayar`, value: formatCurrency(data.totalBayar), inline: true },
            { name: '🧾 Order ID', value: `\`${data.orderId}\``, inline: true },
            { name: `${BOT_CONFIG.emojis.loading} Berlaku Hingga`, value: `<t:${expirationTimestamp}:R>`, inline: true }
        )

        const row = new ActionRowBuilder<ButtonBuilder>()

        if (data.payUrl) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Buka Link Pembayaran')
                    .setStyle(ButtonStyle.Link)
                    .setURL(data.payUrl)
            )
        }

        const replyOptions: any = {
            embeds: [embed],
            components: row.components.length > 0 ? [row] : []
        }

        if (attachment) {
            replyOptions.files = [attachment]
        }

        // Show QR in channel (ephemeral) - Like bot-store-v2 pattern
        await interaction.editReply(replyOptions)

        // Also send to DM as backup
        let dmMessage: Message | null = null
        try {
            dmMessage = await discordUser.send(replyOptions)

            await db.update(transactions)
                .set({ dmMessageId: dmMessage!.id })
                .where(eq(transactions.id, data.transactionId))
        } catch (dmError) {
            console.warn('[Pay QRIS RT] Failed to send DM (user may have DM disabled):', (dmError as Error).message)
        }

        // Start payment polling - will update channel + DM on success/expired
        PaymentSystem.startPolling(interaction, {
            transactionId: data.transactionId,
            orderId: data.orderId,
            productId: productId,
            productName: data.itemName || 'Produk',
            quantity: quantity,
            price: data.totalBayar,
            totalBayar: data.totalBayar,
            paymentMethod: 'qris_realtime',
            dmMessage: dmMessage
        })

    } catch (error: any) {
        console.error('[Pay QRIS RT] Error:', error)
        await interaction.editReply({ embeds: [errorEmbed('Gagal', error.message)] })
    }
}
