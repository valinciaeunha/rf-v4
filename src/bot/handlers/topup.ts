
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder,
    Message
} from 'discord.js'
import { db } from '@/lib/db'
import { users, deposits } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { errorEmbed, createEmbed, formatCurrency } from '../utils'
import { BOT_CONFIG } from '../types'
import { createTokopayOrder } from '@/lib/tokopay'
import { DepositSystem } from '../services/DepositSystem'
import * as QRCode from 'qrcode'
import { PAYMENT_TIMEOUT_MINUTES } from '@/lib/payment-config'

// 1. Handle Topup Button -> Open Modal
export async function handleTopupButton(interaction: any) {
    const modal = new ModalBuilder()
        .setCustomId('modal_topup_amount')
        .setTitle('Topup Saldo')

    const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel("Jumlah Topup (Min Rp 1.000)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('10000')
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(8)

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput)
    modal.addComponents(row)

    await interaction.showModal(modal)
}

// 2. Handle Modal Submit -> Show Payment Methods
export async function handleTopupModalSubmit(interaction: any) {
    const amountStr = interaction.fields.getTextInputValue('amount')
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''))

    if (isNaN(amount) || amount < 1000) {
        await interaction.reply({
            embeds: [errorEmbed('Gagal', 'Minimal topup adalah Rp 1.000')],
            ephemeral: true
        })
        return
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`btn_topup_method_qris_${amount}`)
            .setLabel('QRIS')
            .setEmoji('🧾')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`btn_topup_method_qrisrt_${amount}`)
            .setLabel('QRIS Realtime')
            .setEmoji('⚡')
            .setStyle(ButtonStyle.Success)
    )

    const embed = createEmbed({
        title: 'Pilih Metode Pembayaran',
        description: `Silakan pilih metode untuk topup sebesar **${formatCurrency(amount)}**`,
        color: BOT_CONFIG.color
    })

    await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    })
}

// 3. Handle Payment Method Selection -> Create Order & Show QR
export async function handleTopupMethodButton(interaction: any) {
    const customId = interaction.customId
    const parts = customId.split('_')
    // Format: btn_topup_method_TYPE_AMOUNT
    // type: qris or qrisrt
    const type = parts[3]
    const amount = parseInt(parts[4])
    const discordUser = interaction.user

    await interaction.deferReply({ ephemeral: true })

    try {
        // 1. Get/Create User
        const { getOrCreateUser } = await import('../utils/auto-register')
        const dbUser = await getOrCreateUser(discordUser)

        const methodKey = type === 'qrisrt' ? 'qris_realtime' : 'qris'
        const refId = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // 2. Call Tokopay FIRST to get actual fee info
        const result = await createTokopayOrder({
            amount: amount, // Send requested amount, Tokopay will calculate total with fee
            channel: methodKey,
            refId: refId,
            customerName: dbUser.username,
            customerEmail: dbUser.email,
            itemName: `Topup Saldo ${formatCurrency(amount)}`
        })

        if (result.status !== 'success' || !result.data) {
            throw new Error(result.error_msg || 'Gagal membuat pembayaran ke Tokopay')
        }

        const data = result.data

        // Get actual fee from Tokopay response
        const totalBayar = data.total_bayar || amount
        const totalDiterima = data.total_diterima || amount
        const fee = totalBayar - totalDiterima // Actual fee from Tokopay

        console.log(`[Topup] Amount: ${amount}, TotalBayar: ${totalBayar}, TotalDiterima: ${totalDiterima}, Fee: ${fee}`)

        // 3. Create Deposit Record with correct fee info
        const [deposit] = await db.insert(deposits).values({
            userId: dbUser.id,
            amount: amount.toString(),
            totalBayar: totalBayar.toString(),
            totalDiterima: totalDiterima.toString(),
            paymentChannel: methodKey,
            refId: refId,
            trxId: data.trx_id || refId,
            status: 'pending',
            source: 'bot'
        }).returning()

        // 4. Generate QR
        let attachment: AttachmentBuilder | null = null
        let imageUrl = data.qr_link || data.qr_string || ''

        if (data.qr_string && !data.qr_link) {
            const qrBuffer = await QRCode.toBuffer(data.qr_string)
            attachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' })
            imageUrl = 'attachment://qrcode.png'
        }

        const expirationTimestamp = Math.floor((Date.now() + (PAYMENT_TIMEOUT_MINUTES * 60000)) / 1000)

        const embed = createEmbed({
            title: methodKey === 'qris_realtime' ? '⚡ Topup Saldo (Realtime)' : '🧾 Topup Saldo',
            description: `Silakan scan QRIS di bawah ini untuk menyelesaikan topup.\n\n**Jumlah Topup:** ${formatCurrency(amount)}\n**Biaya Admin:** ${formatCurrency(fee)}\n**Total Bayar:** ${formatCurrency(totalBayar)}\n\n**Ref ID:** \`${refId}\`\n**Berlaku Hingga:** <t:${expirationTimestamp}:R>`,
            color: BOT_CONFIG.color,
            image: imageUrl,
            footer: 'Topup Bot disupport oleh Tokopay'
        })

        const row = new ActionRowBuilder<ButtonBuilder>()
        if (data.pay_url) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Buka Link Pembayaran')
                    .setStyle(ButtonStyle.Link)
                    .setURL(data.pay_url)
            )
        }

        const replyOptions: any = {
            embeds: [embed],
            components: row.components.length > 0 ? [row] : []
        }

        if (attachment) replyOptions.files = [attachment]

        // 5. Send Ephemeral Reply
        await interaction.editReply(replyOptions)

        // 6. Send DM Backup
        let dmMessage: Message | null = null
        try {
            dmMessage = await discordUser.send(replyOptions)
        } catch (e) {
            console.warn('[Topup] Failed to DM:', e)
        }

        // 7. Start Polling
        DepositSystem.startPolling(interaction, {
            depositId: deposit.id,
            refId: refId,
            userId: dbUser.id,
            amount: amount,
            paymentChannel: methodKey,
            dmMessage: dmMessage
        })

    } catch (error: any) {
        console.error('[Topup] Error:', error)
        await interaction.editReply({ embeds: [errorEmbed('Gagal', error.message)] })
    }
}
