import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🚀 Clearing discord_id for all users...');

    try {
        const result = await db.execute(sql`UPDATE users SET discord_id = NULL`);
        console.log(`✅ Successfully cleared discord_id (Result: ${JSON.stringify(result)})`);
    } catch (error) {
        console.error('❌ Error clearing discord_id:', error);
    }

    process.exit(0);
}

main();
