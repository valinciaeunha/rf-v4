import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import readline from 'readline';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

const DUMP_FILE_PATH = 'c:/docker/next-js/redfinger-v4/u848762634_valincia (2).sql';

async function migrate() {
    console.log('🚀 Starting Discord V2 migration...');

    if (!fs.existsSync(DUMP_FILE_PATH)) {
        console.error(`❌ File not found: ${DUMP_FILE_PATH}`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(DUMP_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let count = 0;
    const skipped = 0;
    const batchSize = 1000;
    let buffer: typeof users.$inferInsert[] = [];

    let isInUsersInsert = false;

    // Regex to match INSERT INTO `Users` start
    const insertStartRegex = /INSERT INTO `Users`/i;

    // Regex to match values row
    // Example: ('1000405346092859522', 'haikal5320', 'haikal', 0, '2026-01-17 06:17:48', '2026-01-25 06:42:51')
    const valuesRegex = /\((?:'([^']*)'|NULL),\s*(?:'([^']*)'|NULL),\s*(?:'([^']*)'|NULL),\s*([0-9\.]+),\s*(?:'([^']*)'|NULL),\s*(?:'([^']*)'|NULL)\)/g;

    for await (const line of rl) {
        // Detect start of Users insert
        if (insertStartRegex.test(line)) {
            isInUsersInsert = true;
        }

        // If we are in the block, try to match values
        if (isInUsersInsert) {
            let match;
            // Reset regex state for each line just in case, though usually handled by loop
            // But 'g' flag keeps state, so new regex instance or careful loop is needed? 
            // valuesRegex.exec keeps state.
            // Better to re-create regex or use string matchAll? matchAll is cleaner.

            const matches = line.matchAll(valuesRegex);
            for (const match of matches) {
                const discordId = match[1];
                const username = match[2];
                // const displayName = match[3]; 
                const balance = match[4];
                const createdAt = match[5];
                const updatedAt = match[6];

                if (!discordId || !username) {
                    continue;
                }

                buffer.push({
                    username: username.slice(0, 255),
                    email: `discord_${discordId}@discord.com`,
                    discordId: discordId,
                    role: 'user',
                    balance: balance || '0',
                    createdAt: createdAt ? new Date(createdAt) : new Date(),
                    updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
                });
            }

            if (buffer.length >= batchSize) {
                await insertBatch(buffer);
                count += buffer.length;
                console.log(`✅ Processed ${count} users...`);
                buffer = [];
            }

            // Detect end of statement (semicolon)
            if (line.trim().endsWith(';')) {
                isInUsersInsert = false;
            }
        }
    }

    if (buffer.length > 0) {
        await insertBatch(buffer);
        count += buffer.length;
    }

    console.log(`\n🎉 Migration V2 Complete!`);
    console.log(`Total Processed: ${count}`);
    process.exit(0);
}

async function insertBatch(rows: typeof users.$inferInsert[]) {
    try {
        await db.insert(users)
            .values(rows)
            .onConflictDoUpdate({
                target: users.discordId,
                set: {
                    balance: sql`excluded.balance`, // Update balance from dump
                    username: sql`excluded.username`, // Update username
                    // Don't overwrite email if it exists, to avoid unique constraint issues if format changed
                    // updated_at will be handled by default or we can force it
                }
            });
        // We might have collision on Email if the user exists but doesn't have discordId set yet?
        // The constraint is unique(email) and unique(discordId).
        // If discordId matches, onConflictDoUpdate handles it.
        // If discordId is NEW, but email `discord_ID@discord.com` exists (unlikely unless managed manually), it would fail.
        // Assuming `discord_ID@discord.com` is unique enough for this migration.

    } catch (err) {
        console.error('Batch insert error (partial):', err instanceof Error ? err.message : err);
        // Fallback: Try one by one if batch fails? Or just log.
        // For migration speed, we assume cleanliness usually.
    }
}

migrate().catch(console.error);
