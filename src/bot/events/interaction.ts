import { Events, Interaction, MessageFlags } from 'discord.js'
import { BotEvent, ExtendedClient } from '../types'
import { errorEmbed } from '../utils'

const interactionEvent: BotEvent<typeof Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction: Interaction) {
        const client = interaction.client as ExtendedClient

        // 1. Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName)

            if (!command) {
                await interaction.reply({
                    embeds: [errorEmbed('Error', 'Command tidak ditemukan.')],
                    ephemeral: true
                })
                return
            }

            try {
                await command.execute(interaction)
            } catch (error) {
                console.error(`[Bot] Command error (${interaction.commandName}):`, error)
                const errorMessage = errorEmbed('Error', 'Terjadi kesalahan saat menjalankan command. Silakan coba lagi.')
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorMessage], ephemeral: true })
                } else {
                    await interaction.reply({ embeds: [errorMessage], ephemeral: true })
                }
            }
            return
        }

        // 2. Handle Buttons
        if (interaction.isButton()) {
            const { customId } = interaction
            try {
                // Lazy load handlers to avoid circular deps
                const { handleBuyButton, handleConfirmBuyButton, handlePayBalanceButton, handlePayQrisButton, handlePayQrisRealtimeButton } = await import('../handlers/transaction')

                if (customId === 'btn_buy_product') {
                    await handleBuyButton(interaction)
                }
                else if (customId.startsWith('btn_confirm_buy_')) {
                    await handleConfirmBuyButton(interaction)
                }
                else if (customId.startsWith('btn_pay_balance_')) {
                    await handlePayBalanceButton(interaction)
                }
                else if (customId.startsWith('btn_pay_qrisrt_')) {
                    await handlePayQrisRealtimeButton(interaction)
                }
                else if (customId.startsWith('btn_pay_qris_')) {
                    await handlePayQrisButton(interaction)
                }

                else if (customId === 'btn_info') {
                    const { handleInfoButton } = await import('../handlers/user')
                    await handleInfoButton(interaction)
                }
                else if (customId === 'btn_history') {
                    const { handleHistoryButton } = await import('../handlers/user')
                    await handleHistoryButton(interaction)
                }
                else if (customId === 'btn_history_deposit') {
                    const { handleHistoryDepositButton } = await import('../handlers/user')
                    await handleHistoryDepositButton(interaction)
                }
                else if (customId === 'btn_history_purchase' || customId.startsWith('btn_history_purchase_page_')) {
                    const { handleHistoryPurchaseButton } = await import('../handlers/user')
                    await handleHistoryPurchaseButton(interaction)
                }
                else if (customId.startsWith('btn_trx_detail_')) {
                    const { handleTransactionDetailButton } = await import('../handlers/user')
                    await handleTransactionDetailButton(interaction)
                }
                else if (customId === 'btn_topup') {
                    const { handleTopupButton } = await import('../handlers/topup')
                    await handleTopupButton(interaction)
                }
                else if (customId.startsWith('btn_topup_method_')) {
                    const { handleTopupMethodButton } = await import('../handlers/topup')
                    await handleTopupMethodButton(interaction)
                }
            } catch (error) {
                console.error(`[Bot] Button error (${customId}):`, error)
            }
            return
        }

        // 3. Handle Select Menus
        if (interaction.isStringSelectMenu()) {
            const { customId } = interaction
            try {
                const { handleProductSelect } = await import('../handlers/transaction')

                if (customId === 'select_product_buy') {
                    await handleProductSelect(interaction)
                }
            } catch (error) {
                console.error(`[Bot] Select Menu error (${customId}):`, error)
            }
            return
        }

        // 4. Handle Modals
        if (interaction.isModalSubmit()) {
            const { customId } = interaction
            try {
                const { handleBuyModalSubmit } = await import('../handlers/transaction')
                const { handleTopupModalSubmit } = await import('../handlers/topup')

                if (customId.startsWith('modal_buy_')) {
                    await handleBuyModalSubmit(interaction)
                }
                else if (customId === 'modal_topup_amount') {
                    await handleTopupModalSubmit(interaction)
                }
            } catch (error) {
                console.error(`[Bot] Modal error (${customId}):`, error)
            }
            return
        }
    }
}

export default interactionEvent
