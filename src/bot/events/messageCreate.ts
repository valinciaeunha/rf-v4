import { Events, Message, ChannelType } from 'discord.js'
import { BotEvent } from '../types'
import { db } from '@/lib/db'
import { botSettings, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { callAIWithFallback, sendToolResultsToAI } from '@/lib/ai/providers'
import { CIA_SYSTEM_PROMPT, CIA_TOOLS } from '@/lib/cia/prompt'
import * as ciaTools from '@/lib/actions/cia-tools'

const messageCreateEvent: BotEvent<typeof Events.MessageCreate> = {
    name: Events.MessageCreate,
    once: false,

    async execute(message: Message) {
        // 1. Ignore bot messages
        if (message.author.bot) return

        // 2. Only process guild messages (required for settings & category check)
        if (!message.guildId) return

        try {
            // 3. Fetch Settings direct from DB
            const settings = await db.query.botSettings.findFirst({
                where: eq(botSettings.guildId, message.guildId)
            })

            // If no settings found, ignore
            if (!settings) return

            // 4. Check AI Enabled
            if (!settings.aiChatEnabled) return

            // 5. Check Category
            const categoryIdsString = settings.aiChatCategoryIds
            if (!categoryIdsString || categoryIdsString.trim() === '') return

            // Get channel parent ID (Category)
            const channel = message.channel
            if (channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM) return

            // parentId is available on GuildChannel based types
            // We cast to any to access parentId easily, or check 'parentId' in channel
            const parentId = 'parentId' in channel ? (channel as any).parentId : null

            console.log(`[Bot Debug] Message in Channel: ${(channel as any).name} (${channel.id}), Parent: ${parentId}`)
            console.log(`[Bot Debug] Allowed Categories: ${categoryIdsString}`)

            if (!parentId) return

            const allowedCategories = categoryIdsString.split(',').map(id => id.trim())

            if (!allowedCategories.includes(parentId)) {
                console.log(`[Bot Debug] Ignored: Parent ID ${parentId} not in allowed list.`)
                return
            }

            // 6. Process AI
            await channel.sendTyping()

            // 7. Get User Context (Linked DB User)
            const dbUser = await db.query.users.findFirst({
                where: eq(users.discordId, message.author.id)
            })

            // 8. Build System Prompt
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://redfinger.id'
            const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

            const systemPrompt = `${CIA_SYSTEM_PROMPT}

📌 CURRENT CONTEXT:
- Platform: Discord Integration
- Server: ${message.guild?.name || 'Redfinger Store'}
- Channel: ${(channel as any).name || 'Unknown'}
- User: ${message.author.username} (${dbUser ? `Linked: ${dbUser.username} (ID: ${dbUser.id})` : 'Unlinked Account'})
- Current Time (WIB): ${now}

📝 DISCORD SPECIFIC INSTRUCTIONS:
- You are chatting in a Discord Channel. Be aware of formatting (bold, italic, code blocks work well).
- LINKS: Discord does NOT support masked links like [Link Name](URL). You MUST use RAW URLs only.
  * BAD: [Play Store](https://...) OR [https://redfinger.com](...)
  * GOOD: Play Store (https://...) OR just https://redfinger.com
  * EXAMPLE: "Download di Play Store: https://play.google.com/store/apps/details?id=com.redfinger.global"
- UNLINKED USERS: If 'Unlinked Account', you CANNOT check their specific transactions/deposits. Ask them to link their Discord on the website or check manually.
- TOOLS: You can use tools to check stock or general info. For user-specific tools, only proceed if user is Linked.
`

            // 9. Call AI Initial
            const initialResponse = await callAIWithFallback(
                systemPrompt,
                [{ role: "user", content: message.content }],
                CIA_TOOLS
            )

            if (!initialResponse) return

            let finalContent = initialResponse.content || ""

            // 10. Handle Tool Calls Loop
            if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0) {
                const toolResults: Array<{ name: string; result: any }> = []

                // Show "Thinking..." or similar if needed, but typing indicator is enough usually.

                for (const tool of initialResponse.toolCalls) {
                    const args = tool.arguments || {}
                    let result: any = null

                    try {
                        // Check Auth for Protected Tools
                        const userProtectedTools = ['getUserProfile', 'getUserTransactions', 'getTransactionDetail', 'getUserDeposits', 'getPendingTransactions']

                        // We automatically inject userId for protected tools if dbUser exists
                        if (userProtectedTools.includes(tool.name)) {
                            // CASE 1: Check Specific Order (Allowed for Guests)
                            if (tool.name === 'getTransactionDetail') {
                                // If user provided an ID, we check it confidently regardless of link status
                                const searchId = args.trxIdOrOrderId || args.orderId;
                                result = await ciaTools.getTransactionDetail(searchId, dbUser ? dbUser.id : -1);
                            }
                            // CASE 2: User Personal Data (Must be Linked)
                            else if (!dbUser) {
                                result = "User is not linked/identified. I cannot check 'My History'. Please ask them for a specific Order ID (ORD-xxx) or ask them to Link Discord Account on website.";
                            }
                            // CASE 3: Linked User Data
                            else {
                                if (tool.name === 'getUserProfile') result = await ciaTools.getUserProfile(dbUser.id)
                                else if (tool.name === 'getUserTransactions') result = await ciaTools.getUserTransactions(dbUser.id, args.limit)
                                else if (tool.name === 'getPendingTransactions') result = await ciaTools.getPendingTransactions(dbUser.id)
                                else if (tool.name === 'getUserDeposits') result = await ciaTools.getUserDeposits(dbUser.id, args.limit)
                            }
                        } else {
                            // Public Tools
                            if (tool.name === 'checkProductStock') result = await ciaTools.checkProductStock(args.query)
                            else if (tool.name === 'getAllProducts') result = await ciaTools.getAllProducts()
                            else result = `Tool ${tool.name} not supported in Discord context yet(requires ticket context).`
                        }
                    } catch (err: any) {
                        console.error(`[Bot] Tool Error ${tool.name}: `, err)
                        result = `Error executing ${tool.name}: ${err.message} `
                    }

                    toolResults.push({ name: tool.name, result })
                }

                // Call AI again with tool results
                const followUp = await sendToolResultsToAI(
                    initialResponse.provider,
                    initialResponse.model,
                    systemPrompt,
                    [{ role: "user", content: message.content }], // Re-send history context
                    toolResults,
                    CIA_TOOLS
                )

                if (followUp?.content) {
                    finalContent = followUp.content
                }
            }

            // 11. Send Final Reply
            if (finalContent) {
                // Split message if too long (Discord limit 2000)
                if (finalContent.length > 2000) {
                    const chunks = finalContent.match(/[\s\S]{1,2000}/g) || []
                    for (const chunk of chunks) {
                        await message.reply({
                            content: chunk,
                            allowedMentions: { repliedUser: false }
                        })
                    }
                } else {
                    await message.reply({
                        content: finalContent,
                        allowedMentions: { repliedUser: false }
                    })
                }
            }

        } catch (error) {
            console.error('[Bot] Message AI Error:', error)
        }
    }
}

export default messageCreateEvent
