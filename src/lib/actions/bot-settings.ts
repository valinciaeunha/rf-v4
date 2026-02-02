'use server'

import { db } from '@/lib/db'
import { botSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Get Bot Settings by Guild ID
 * For now, we assume single guild usage or main guild. 
 * If multiple guilds, we might need to pass guildId or derive from user session if we had multi-tenancy.
 * For this project, let's assume a default configured guild ID in env or passed from UI.
 * 
 * Update: The UI will ask for Guild ID initially or we default to the env one?
 * The requirements say "Web or Bot", implying single bot instance.
 * We will allow user to input Guild ID in the settings form for flexibility.
 */
import { logger } from "@/lib/logger"

export async function getBotSettings(guildId?: string) {
    try {
        if (guildId) {
            const settings = await db.query.botSettings.findFirst({
                where: eq(botSettings.guildId, guildId)
            })
            return settings
        } else {
            // If no ID provided, fetch the first one found (Single-tenant assumption)
            const settings = await db.query.botSettings.findFirst()
            return settings
        }
    } catch (error) {
        logger.error('Failed to get bot settings:', error)
        return null
    }
}

export async function updateBotSettings(data: {
    guildId: string
    publicLogChannelId: string
    privateLogChannelId: string
    expiredLogChannelId: string
}) {
    try {
        // Upsert
        await db.insert(botSettings).values({
            guildId: data.guildId,
            publicLogChannelId: data.publicLogChannelId,
            privateLogChannelId: data.privateLogChannelId,
            expiredLogChannelId: data.expiredLogChannelId
        }).onConflictDoUpdate({
            target: botSettings.guildId,
            set: {
                publicLogChannelId: data.publicLogChannelId,
                privateLogChannelId: data.privateLogChannelId,
                expiredLogChannelId: data.expiredLogChannelId,
                updatedAt: new Date()
            }
        })

        revalidatePath('/developer/discord-bot')
        return { success: true }
    } catch (error) {
        logger.error('Failed to update bot settings:', error)
        return { success: false, error: 'Failed to update settings' }
    }
}
