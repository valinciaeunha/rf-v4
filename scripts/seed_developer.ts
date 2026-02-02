/**
 * Script untuk membuat akun developer
 * 
 * Usage: npx tsx scripts/seed_developer.ts
 */

import { db } from '../src/lib/db'
import { users } from '../src/lib/db/schema'
import { hash } from 'bcryptjs'

async function seedDeveloper() {
    console.log('🔧 Creating developer account...\n')

    const email = 'developer@redfinger.id'
    const password = 'developer123' // Ganti sesuai kebutuhan
    const username = 'Developer'

    try {
        const hashedPassword = await hash(password, 12)

        const result = await db.insert(users).values({
            username,
            email,
            password: hashedPassword,
            role: 'developer',
            balance: '0.00',
        }).returning()

        console.log('✅ Developer account created!')
        console.log('')
        console.log('📧 Email:', email)
        console.log('🔑 Password:', password)
        console.log('👤 Role:', 'developer')
        console.log('')
        console.log('Silakan login dengan kredensial di atas.')

    } catch (error: any) {
        if (error.code === '23505') {
            console.log('ℹ️  Developer account already exists')
        } else {
            console.error('❌ Error:', error.message)
        }
    }

    process.exit(0)
}

seedDeveloper().catch(console.error)

