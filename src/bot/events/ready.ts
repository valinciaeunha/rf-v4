import { Client, Events, ActivityType } from 'discord.js'
import { BotEvent, ExtendedClient, BOT_CONFIG } from '../types'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { count } from 'drizzle-orm'

const readyEvent: BotEvent<typeof Events.ClientReady> = {
    name: Events.ClientReady,
    once: true,

    async execute(client: Client<true>) {
        const extClient = client as unknown as ExtendedClient

        const updateStatus = async () => {
            try {
                const result = await db.select({ value: count() }).from(users);
                const totalUsers = result[0].value;

                // Set bot activity to "Watching X Users"
                client.user.setActivity(`${totalUsers} Users`, { type: ActivityType.Watching });
            } catch (error) {
                console.error('[Bot] Failed to update status:', error);
            }
        };

        // Initial update
        await updateStatus();

        // Update every 5 minutes
        setInterval(updateStatus, 5 * 60 * 1000);

        // Log bot info
        const guilds = client.guilds.cache.size
        const discordMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)

        console.log(`[Bot] ${BOT_CONFIG.name} is online!`)
        console.log(`[Bot] Logged in as: ${client.user.tag}`)
        console.log(`[Bot] Serving ${guilds} servers with ${discordMembers} discord members`)
        console.log(`[Bot] Commands loaded: ${extClient.commands.size}`)
    }
}

export default readyEvent
