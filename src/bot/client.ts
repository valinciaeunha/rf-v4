import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js'
import { ExtendedClient, BotCommand, BotEvent } from './types'

// Import commands
import showCommand from './commands/show'

// Import events
import readyEvent from './events/ready'
import interactionEvent from './events/interaction'

// ============== CLIENT SETUP ==============

export function createClient(): ExtendedClient {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
        ]
    }) as ExtendedClient

    client.commands = new Collection()

    return client
}

// ============== LOAD COMMANDS ==============

export function loadCommands(client: ExtendedClient): BotCommand[] {
    const commands: BotCommand[] = [
        showCommand,
        // Add more commands here as they're created
        // balanceCommand,
        // productsCommand,
        // buyCommand,
        // etc.
    ]

    // Register commands to collection
    for (const command of commands) {
        client.commands.set(command.data.name, command)
    }

    return commands
}

// ============== LOAD EVENTS ==============

export function loadEvents(client: ExtendedClient): void {
    const events: BotEvent[] = [
        readyEvent as BotEvent,
        interactionEvent as BotEvent,
        // Add more events here
    ]

    for (const event of events) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args))
        } else {
            client.on(event.name, (...args) => event.execute(...args))
        }
    }
}

// ============== REGISTER SLASH COMMANDS ==============

export async function registerCommands(commands: BotCommand[]): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN
    const clientId = process.env.DISCORD_CLIENT_ID

    if (!token || !clientId) {
        console.error('[Bot] Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID')
        return
    }

    const rest = new REST({ version: '10' }).setToken(token)

    const commandData = commands.map(cmd => cmd.data.toJSON())

    try {
        // Register commands globally (takes up to 1 hour to propagate)
        // For instant testing, use guild-specific registration
        const guildId = process.env.DISCORD_GUILD_ID

        if (guildId) {
            // Guild-specific (instant for development)
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commandData }
            )
        } else {
            // Global (production)
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commandData }
            )
        }
    } catch (error) {
        console.error('[Bot] Failed to register commands:', error)
    }
}
