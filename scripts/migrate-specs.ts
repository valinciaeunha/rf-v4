/**
 * Quick migration for product_specifications only
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { productSpecifications } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import mysql from 'mysql2/promise';

async function main() {
    const maria = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'rootpassword',
        database: 'redfing1_db'
    });

    console.log('📦 Migrating PRODUCT SPECIFICATIONS...');

    const [rows] = await maria.query<mysql.RowDataPacket[]>(`
        SELECT id, product_id, icon_type, label, display_order, is_active, created_at, updated_at 
        FROM product_specifications ORDER BY id
    `);

    console.log(`   Found ${rows.length} specs`);

    await db.execute(sql`TRUNCATE TABLE product_specifications CASCADE`);

    for (const row of rows) {
        await db.insert(productSpecifications).values({
            id: row.id,
            productId: row.product_id,
            iconType: row.icon_type,
            label: row.label,
            displayOrder: row.display_order || 0,
            isActive: row.is_active === 1,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        }).onConflictDoNothing();
    }

    const maxId = await db.execute(sql`SELECT MAX(id) as max_id FROM product_specifications`);
    if (maxId.rows[0]?.max_id) {
        await db.execute(sql`SELECT setval('product_specifications_id_seq', ${maxId.rows[0].max_id})`);
    }

    const count = await db.execute(sql`SELECT COUNT(*) as c FROM product_specifications`);
    console.log(`   ✅ Migrated ${count.rows[0].c} product specifications`);

    await maria.end();
    process.exit(0);
}

main().catch(console.error);
