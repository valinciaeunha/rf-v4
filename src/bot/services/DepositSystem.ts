
import { db } from '@/lib/db'
import { deposits, users } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { checkTokopayOrderStatus } from '@/lib/tokopay'
import { TOKOPAY_CHANNELS, TokopayChannelKey } from '@/lib/tokopay-constants'
import { successEmbed, errorEmbed } from '@/bot/utils/embed'
import { PAYMENT_TIMEOUT_MINUTES } from '@/lib/payment-config'

// Polling Interval
const POLL_INTERVAL_MS = 5000

interface DepositContext {
    depositId: number
    refId: string
    userId: number
    amount: number
    paymentChannel: string
    dmMessage?: any
}

export const DepositSystem = {
    startPolling(interaction: any, context: DepositContext) {
        console.log(`[DepositSystem] Start polling for Ref ${context.refId}`)

        const startTime = Date.now()
        // Use timeout from config or default 15-30 mins? 
        // Deposits might have longer expiry? Let's use standard timeout.
        const timeout = PAYMENT_TIMEOUT_MINUTES * 60 * 1000

        const pollInterval = setInterval(async () => {
            // 1. Timeout Check
            if (Date.now() - startTime > timeout) {
                console.log(`[DepositSystem] Timeout for ${context.refId}`)
                clearInterval(pollInterval)
                await this.handleExpired(interaction, context)
                return
            }

            try {
                // 2. Check Tokopay Status
                // paymentChannel string to Key mapping might be needed if they differ
                // In DB we store keys like 'qris' or 'qris_realtime' usually.
                // TOKOPAY_CHANNELS expects keys.
                const channelCode = TOKOPAY_CHANNELS[context.paymentChannel as TokopayChannelKey] || 'QRIS'

                const result = await checkTokopayOrderStatus(
                    context.refId,
                    undefined,
                    context.amount,
                    channelCode
                )

                if (!result || !result.data) return

                const status = (result.data.status || '').toLowerCase()

                if (status === 'paid' || status === 'success' || status === 'berhasil') {
                    console.log(`[DepositSystem] ✅ Success: ${context.refId}`)
                    clearInterval(pollInterval)
                    await this.handleSuccess(interaction, context)
                } else if (status === 'expired' || status === 'kadaluarsa') {
                    console.log(`[DepositSystem] ⏱️ Expired: ${context.refId}`)
                    clearInterval(pollInterval)
                    await this.handleExpired(interaction, context)
                }

            } catch (error) {
                console.error(`[DepositSystem] Error polling ${context.refId}:`, error)
            }

        }, POLL_INTERVAL_MS)
    },

    async handleSuccess(interaction: any, context: DepositContext) {
        try {
            // 1. Double check DB status to avoid race condition with Webhook/SyncService
            const [deposit] = await db.select().from(deposits).where(eq(deposits.id, context.depositId))

            if (!deposit || deposit.status === 'success') {
                // Already processed
                return
            }

            // 2. Update DB
            await db.transaction(async (tx) => {
                await tx.update(deposits)
                    .set({ status: 'success', paidAt: new Date() })
                    .where(eq(deposits.id, context.depositId))

                await tx.update(users)
                    .set({ balance: sql`${users.balance} + ${context.amount}` })
                    .where(eq(users.id, context.userId))
            })

            // 3. UI Update (Ephemeral)
            const embed = successEmbed('Topup Berhasil! 💎',
                `Saldo sebesar **Rp ${context.amount.toLocaleString('id-ID')}** telah ditambahkan ke akun Anda.\nRef ID: \`${context.refId}\``
            )

            await interaction.editReply({
                embeds: [embed],
                components: [],
                files: []
            }).catch(() => { })

            // 4. DM Update (if any)
            if (context.dmMessage) {
                await context.dmMessage.edit({
                    embeds: [embed],
                    components: [],
                    files: []
                }).catch(() => { })
            } else {
                // Send DM
                try {
                    await interaction.user.send({ embeds: [embed] })
                } catch { }
            }

        } catch (error) {
            console.error('[DepositSystem] Handle Success Error:', error)
        }
    },

    async handleExpired(interaction: any, context: DepositContext) {
        try {
            await db.update(deposits)
                .set({ status: 'expired' })
                .where(eq(deposits.id, context.depositId))

            const embed = errorEmbed('Topup Kadaluarsa ⏳',
                `Waktu pembayaran untuk topup sejumlah **Rp ${context.amount.toLocaleString('id-ID')}** telah habis.\nSilakan ulangi kembali jika ingin melanjutkan.`
            )

            await interaction.editReply({
                embeds: [embed],
                components: [],
                files: []
            }).catch(() => { })

            if (context.dmMessage) {
                await context.dmMessage.edit({
                    embeds: [embed],
                    components: [],
                    files: []
                }).catch(() => { })
            }

        } catch (error) {
            console.error('[DepositSystem] Handle Expired Error:', error)
        }
    }
}
