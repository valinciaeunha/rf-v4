/**
 * Script untuk menghapus semua slash commands dari Discord bot
 * 
 * Usage: npx tsx scripts/clear_discord_commands.ts
 * 
 * Ini akan menghapus:
 * - Semua global commands
 * - Semua guild-specific commands (jika DISCORD_GUILD_ID diset)
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { REST, Routes } from 'discord.js'

async function clearCommands() {
    const token = process.env.DISCORD_BOT_TOKEN
    const clientId = process.env.DISCORD_CLIENT_ID
    const guildId = process.env.DISCORD_GUILD_ID

    if (!token) {
        console.error('❌ DISCORD_BOT_TOKEN tidak ditemukan di .env.local')
        process.exit(1)
    }

    if (!clientId) {
        console.error('❌ DISCORD_CLIENT_ID tidak ditemukan di .env.local')
        process.exit(1)
    }

    const rest = new REST({ version: '10' }).setToken(token)

    console.log('🗑️  Menghapus slash commands...\n')

    try {
        // Clear guild-specific commands (if guild ID is set)
        if (guildId) {
            console.log(`📍 Clearing guild commands for: ${guildId}`)

            // Get existing commands
            const guildCommands = await rest.get(
                Routes.applicationGuildCommands(clientId, guildId)
            ) as any[]

            console.log(`   Found ${guildCommands.length} guild commands`)

            // Delete all
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: [] }
            )

            console.log('   ✅ Guild commands cleared!')
        }

        // Clear global commands
        console.log('\n🌐 Clearing global commands...')

        const globalCommands = await rest.get(
            Routes.applicationCommands(clientId)
        ) as any[]

        console.log(`   Found ${globalCommands.length} global commands:`)
        globalCommands.forEach(cmd => {
            console.log(`   - /${cmd.name}`)
        })

        // Delete all global commands
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: [] }
        )

        console.log('   ✅ Global commands cleared!')

        console.log('\n✅ Semua commands berhasil dihapus!')
        console.log('\n📝 Sekarang jalankan bot untuk register commands baru:')
        console.log('   npm run bot:start\n')

    } catch (error: any) {
        console.error('\n❌ Error:', error.message)

        if (error.code === 50001) {
            console.error('   Bot tidak punya akses. Pastikan bot sudah di-invite dengan scope "applications.commands"')
        }
    }

    process.exit(0)
}

clearCommands()
