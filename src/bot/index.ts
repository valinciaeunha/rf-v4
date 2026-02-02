import { createClient, loadCommands, loadEvents, registerCommands } from './client'
import { ExtendedClient } from './types'

let botClient: ExtendedClient | null = null

// ============== START BOT ==============

export async function startBot(): Promise<ExtendedClient | null> {
    const token = process.env.DISCORD_BOT_TOKEN

    if (!token) {
        console.error('[Bot] DISCORD_BOT_TOKEN not found. Bot will not start.')
        return null
    }

    // Prevent multiple instances
    if (botClient) {
        return botClient
    }

    try {
        // Create client
        botClient = createClient()

        // Load commands and events
        const commands = loadCommands(botClient)
        loadEvents(botClient)

        // Register slash commands with Discord API
        await registerCommands(commands)

        // Login
        await botClient.login(token)

        // Start background tasks
        const { startPaymentMonitor } = await import('./services/payment-monitor')
        startPaymentMonitor(botClient)

        return botClient
    } catch (error) {
        console.error('[Bot] Failed to start:', error)
        botClient = null
        return null
    }
}

// ============== STOP BOT ==============

export async function stopBot(): Promise<void> {
    if (botClient) {
        botClient.destroy()
        botClient = null
    }
}

// ============== GET CLIENT ==============

export function getClient(): ExtendedClient | null {
    return botClient
}

// Export types
export * from './types'
