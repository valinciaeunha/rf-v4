import { Client, ClientEvents, Collection, SlashCommandBuilder, ChatInputCommandInteraction, REST, Routes } from 'discord.js'

// ============== TYPES ==============

export interface BotCommand {
    data: SlashCommandBuilder
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
    name: K
    once?: boolean
    execute: (...args: ClientEvents[K]) => Promise<void>
}

export interface ExtendedClient extends Client {
    commands: Collection<string, BotCommand>
}

// ============== CONFIG ==============

export const BOT_CONFIG = {
    // Bot metadata
    name: 'Redfinger Bot',
    version: '1.0.0',
    color: 0xEE98BB, // V2 Style Pink

    // Links
    supportServer: process.env.DISCORD_SUPPORT_SERVER || '',
    website: process.env.NEXT_PUBLIC_APP_URL || 'https://redfinger.id',

    // Emojis (customize as needed)
    emojis: {
        success: '<:check:1467191230642389084>',
        error: '<:error:1467187681271484559>',
        warning: '<:warning:1467187988529414164>',
        loading: '<:jam_pasir:1467188461319491655>',
        money: '<:cash:1467183637274431742>',
        product: '<:produk:1467183362518024436>',
        user: '<:profile:1467188199096061952>',
    }
}
