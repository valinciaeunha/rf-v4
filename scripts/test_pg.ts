import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

async function test() {
    console.log('Testing direct pg connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':****@'));

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const res = await pool.query('SELECT NOW() as now, version() as version');
        console.log('✅ Connection successful!');
        console.log('Server time:', res.rows[0].now);
        console.log('Version:', res.rows[0].version.substring(0, 50) + '...');

        // Check users table
        const users = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('User count:', users.rows[0].count);

    } catch (e) {
        console.error('❌ Connection failed:', e);
    } finally {
        await pool.end();
    }
}
test();
