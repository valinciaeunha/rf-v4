import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import readline from 'readline';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

const DUMP_FILE_PATH = 'c:/docker/next-js/redfinger-v4/redfing1_db (8).sql';

async function migrate() {
    console.log('🚀 Starting migration...');

    if (!fs.existsSync(DUMP_FILE_PATH)) {
        console.error(`❌ Dump file not found at: ${DUMP_FILE_PATH}`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(DUMP_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let totalInserted = 0;
    let skipped = 0;
    const buffer: typeof users.$inferInsert[] = [];
    const BATCH_SIZE = 1000;
    let isReadingValues = false;

    console.log('📂 Reading SQL dump...');

    for await (const line of rl) {
        const trimmedLine = line.trim();

        // Start reading when we see the INSERT statement for users
        if (trimmedLine.startsWith('INSERT INTO `users`') || trimmedLine.startsWith('INSERT INTO users')) {
            isReadingValues = true;
            // Check if this line also contains values (single line insert)
            if (!trimmedLine.includes('VALUES')) {
                continue;
            }
            // If it ends with values on same line, we process it below.
        }

        if (isReadingValues) {
            // Logic to parse parens ()
            // We look for patterns like (1, ...), or (1, ...);
            // We use a regex that matches balanced parens roughly?
            // Or just simple split by `),(` if strict.

            // Let's try matching all occurrences of (...) followed by , or ;
            // Note: This regex assumes no `)` inside unquoted strings, which is generally safe for this dataset.
            const records = line.match(/\((.*?)\)(,|;)/g);

            if (records) {
                for (const recordStr of records) {
                    try {
                        // Clean parens and delimiters
                        let cleanStr = recordStr.trim();
                        if (cleanStr.endsWith(',')) cleanStr = cleanStr.slice(0, -1);
                        if (cleanStr.endsWith(';')) cleanStr = cleanStr.slice(0, -1);
                        if (cleanStr.startsWith('(')) cleanStr = cleanStr.slice(1);
                        if (cleanStr.endsWith(')')) cleanStr = cleanStr.slice(0, -1);

                        // Basic SQL CSV parser
                        const values: string[] = [];
                        let currentVal = '';
                        let inQuote = false;

                        for (let i = 0; i < cleanStr.length; i++) {
                            const char = cleanStr[i];
                            if (char === "'" && (i === 0 || cleanStr[i - 1] !== '\\')) {
                                inQuote = !inQuote;
                            } else if (char === ',' && !inQuote) {
                                values.push(currentVal.trim());
                                currentVal = '';
                                continue;
                            }
                            currentVal += char;
                        }
                        values.push(currentVal.trim());

                        // Map to schema
                        // Format: id, username, email, whatsapp, discord, password, role, balance, created, updated...

                        const id = parseInt(values[0]);
                        const username = values[1].replace(/^'|'$/g, '');
                        const email = values[2].replace(/^'|'$/g, '');
                        const whatsapp = values[3] === 'NULL' ? null : values[3].replace(/^'|'$/g, '');
                        const discordId = values[4] === 'NULL' ? null : values[4].replace(/^'|'$/g, '');
                        const password = values[5] === 'NULL' ? null : values[5].replace(/^'|'$/g, '');
                        const role = values[6].replace(/^'|'$/g, '');
                        const balance = values[7];
                        const createdAt = values[8].replace(/^'|'$/g, '');
                        const updatedAt = values[9].replace(/^'|'$/g, '');

                        // Basic validation
                        if (!email || !username) continue;

                        buffer.push({
                            id,
                            username,
                            email,
                            whatsappNumber: whatsapp,
                            discordId: discordId,
                            password,
                            role: role || 'user',
                            balance: balance,
                            createdAt: new Date(createdAt),
                            updatedAt: new Date(updatedAt || createdAt),
                        });

                        if (buffer.length >= BATCH_SIZE) {
                            await insertBatch(buffer);
                            totalInserted += buffer.length;
                            buffer.length = 0;
                            console.log(`✅ Processed ${totalInserted} users...`);
                        }

                    } catch (e) {
                        skipped++;
                    }
                }
            }

            // Stop reading if line ends with ;
            if (trimmedLine.endsWith(';')) {
                isReadingValues = false;
            }
        }
    }

    // Insert remaining
    if (buffer.length > 0) {
        await insertBatch(buffer);
        totalInserted += buffer.length;
    }

    // Adjust sequence
    console.log('🔄 Adjusting ID sequence...');
    // Ensure we don't fail if table is empty
    const maxIdRes = await db.execute(sql`SELECT MAX(id) as max_id FROM users`);
    const maxId = maxIdRes.rows[0]?.max_id; // Postgres returns lowercase cols usually

    if (maxId) {
        await db.execute(sql`SELECT setval('users_id_seq', ${maxId})`);
        console.log(`✅ Sequence set to ${maxId}`);
    } else {
        console.log('⚠️ No users found, skipping sequence adjustment.');
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`Total Users Inserted: ${totalInserted}`);
    console.log(`Total Skipped/Errors: ${skipped}`);

    process.exit(0);
}

async function insertBatch(rows: typeof users.$inferInsert[]) {
    try {
        await db.insert(users).values(rows).onConflictDoNothing();
    } catch (err) {
        console.error('Batch insert error (partial):', err instanceof Error ? err.message : err);
    }
}

migrate();
