
import { db } from "../src/lib/db";
import { stocks, users } from "../src/lib/db/schema";
import fs from "fs";
import readline from "readline";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting full stocks migration...");

    // Check if file exists
    const filePath = "redfing1_db (7).sql";
    if (!fs.existsSync(filePath)) {
        console.error("SQL file not found:", filePath);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let insideStocksInsert = false;
    let batch: any[] = [];
    const BATCH_SIZE = 1000;
    let totalInserted = 0;

    // Load all user IDs for FK validation
    console.log("Loading valid user IDs...");
    const allUsers = await db.select({ id: users.id }).from(users);
    const validUserIds = new Set(allUsers.map(u => u.id));
    console.log(`Loaded ${validUserIds.size} valid users.`);

    // Regex to parse values: (id, product_id, 'code', 'status', sold_to, 'created_at', 'updated_at')
    // Example: (223, 2, 'HcFIE03M', 'sold', 15, '2025-10-13 16:04:40', '2025-10-13 16:05:07'),
    // Note: sold_to can be number (15) or NULL
    const valueRegex = /^\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*(\d+|NULL),\s*'([^']*)',\s*'([^']*)'\)/;

    // We can disable Foreign Key checks if needed, but since we have valid products/users, strict is better.
    // However, for bulk inserts, sometimes it's faster. We'll keep it standard for now.

    for await (const line of rl) {
        const trimmed = line.trim();

        if (trimmed.startsWith("INSERT INTO `stocks`")) {
            insideStocksInsert = true;
            continue;
        }

        if (insideStocksInsert) {
            // Check for end of insert block
            if (trimmed === "" || trimmed.startsWith("--") || trimmed.startsWith("CREATE") || trimmed.startsWith("INSERT")) {
                if (!trimmed.startsWith("INSERT INTO `stocks`")) {
                    insideStocksInsert = false;
                }
            }

            // Attempt to match value tuple
            const match = trimmed.match(valueRegex);
            if (match) {
                const [_, id, productId, code, status, soldToStr, createdAt, updatedAt] = match;

                let soldTo = soldToStr === 'NULL' ? null : parseInt(soldToStr);

                // Validate soldTo
                if (soldTo !== null && !validUserIds.has(soldTo)) {
                    // console.warn(`Warning: User ${soldTo} not found for stock ${id}. Setting soldTo to NULL.`);
                    soldTo = null;
                }

                batch.push({
                    id: parseInt(id),
                    productId: parseInt(productId),
                    code: code,
                    status: status as 'ready' | 'sold' | 'reserved',
                    soldTo: soldTo,
                    createdAt: new Date(createdAt),
                    updatedAt: new Date(updatedAt)
                });

                if (batch.length >= BATCH_SIZE) {
                    await insertBatch(batch);
                    totalInserted += batch.length;
                    console.log(`Inserted ${totalInserted} stocks...`);
                    batch = [];
                }
            }

            // If line ends with semicolon, that's the end of this INSERT statement
            if (trimmed.endsWith(";")) {
                insideStocksInsert = false;
            }
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await insertBatch(batch);
        totalInserted += batch.length;
        console.log(`Inserted ${totalInserted} stocks...`);
    }

    // Update sequence
    console.log("Updating sequence...");
    await db.execute(sql`SELECT setval('stocks_id_seq', (SELECT MAX(id) FROM stocks))`);

    console.log("Migration complete!");
    process.exit(0);
}

async function insertBatch(data: any[]) {
    try {
        await db.insert(stocks).values(data).onConflictDoNothing();
    } catch (e) {
        console.error("Batch insert failed:", e);
        // Optional: try inserting one by one to find the error or just skip
    }
}

main().catch(err => {
    console.error("Migration fatal error:", err);
    process.exit(1);
});
