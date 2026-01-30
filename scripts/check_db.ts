import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function check() {
    console.log('Checking DB connection...');
    // Mask password for safety in logs
    const dbUrl = process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':****@') || 'undefined';
    console.log('Using DATABASE_URL:', dbUrl);

    try {
        const countRes = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
        console.log('User count:', countRes.rows[0]);

        // Check if sequence logic works roughly
        const maxRes = await db.execute(sql`SELECT MAX(id) as max_id FROM users`);
        console.log('Max ID:', maxRes.rows[0]);

    } catch (e) {
        console.error('Connection failed:', e);
    }
    process.exit(0);
}
check();
