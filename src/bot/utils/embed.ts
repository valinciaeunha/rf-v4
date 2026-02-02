import { EmbedBuilder, ColorResolvable } from 'discord.js'
import { BOT_CONFIG } from '../types'

// ============== EMBED BUILDERS ==============

interface EmbedOptions {
    title?: string
    description?: string
    color?: ColorResolvable
    fields?: { name: string; value: string; inline?: boolean }[]
    thumbnail?: string
    image?: string
    footer?: string
    timestamp?: boolean
}

export function createEmbed(options: EmbedOptions): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(options.color || BOT_CONFIG.color)

    if (options.title) embed.setTitle(options.title)
    if (options.description) embed.setDescription(options.description)
    if (options.thumbnail) embed.setThumbnail(options.thumbnail)
    if (options.image) embed.setImage(options.image)
    if (options.footer) embed.setFooter({ text: options.footer })
    if (options.timestamp) embed.setTimestamp()

    if (options.fields) {
        for (const field of options.fields) {
            embed.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline ?? false
            })
        }
    }

    return embed
}

export function successEmbed(title: string, description?: string): EmbedBuilder {
    return createEmbed({
        title: `${BOT_CONFIG.emojis.success} ${title}`,
        description,
        color: BOT_CONFIG.color,
    })
}

export function errorEmbed(title: string, description?: string): EmbedBuilder {
    return createEmbed({
        title: `${BOT_CONFIG.emojis.error} ${title}`,
        description,
        color: BOT_CONFIG.color, // Or keep red if strictly error
    })
}

export function warningEmbed(title: string, description?: string): EmbedBuilder {
    return createEmbed({
        title: `${BOT_CONFIG.emojis.warning} ${title}`,
        description,
        color: BOT_CONFIG.color,
    })
}

export function infoEmbed(title: string, description?: string): EmbedBuilder {
    return createEmbed({
        title,
        description,
        color: BOT_CONFIG.color,
    })
}

// ============== FORMAT HELPERS ==============

export function formatCurrency(amount: number | string): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(amount))
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date)
}
