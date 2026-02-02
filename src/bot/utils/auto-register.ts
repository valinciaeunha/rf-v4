
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { User } from 'discord.js'

/**
 * Get existing user or create a new one based on Discord ID
 */
export async function getOrCreateUser(discordUser: User) {
    try {
        let dbUser = await db.query.users.findFirst({
            where: eq(users.discordId, discordUser.id)
        })

        if (!dbUser) {
            console.log(`[AutoRegister] Registering new user: ${discordUser.username} (${discordUser.id})`)

            // Generate placeholder email
            const placeholderEmail = `discord_${discordUser.id}@discord.com`

            const [newUser] = await db.insert(users).values({
                username: discordUser.username,
                email: placeholderEmail,
                discordId: discordUser.id,
                role: 'user',
                balance: '0'
            }).returning()

            dbUser = newUser
        }

        return dbUser
    } catch (error) {
        console.error('[AutoRegister] Error:', error)
        throw error
    }
}
