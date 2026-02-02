/**
 * Standalone script untuk menjalankan Discord bot
 * 
 * Usage: npx tsx scripts/run_bot.ts
 */

import { startBot } from '../src/bot'

async function main() {
    console.log('🤖 Starting Discord bot...\n')

    const client = await startBot()

    if (!client) {
        console.error('❌ Failed to start bot. Check DISCORD_BOT_TOKEN.')
        process.exit(1)
    }

    // Start Live Stock System
    const { LiveStockSystem } = await import('../src/bot/services/LiveStockSystem')
    await LiveStockSystem.start(client)

    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down bot...')
        LiveStockSystem.stop()
        client.destroy()
        process.exit(0)
    })
}

main()
