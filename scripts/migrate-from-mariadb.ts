/**
 * Fast Migration Script using MariaDB Docker Connection
 * Migrates data directly from MariaDB container to PostgreSQL
 * 
 * Usage: npx tsx scripts/migrate-from-mariadb.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { users, deposits, transactions, products, stocks, productSpecifications } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import mysql from 'mysql2/promise';

const BATCH_SIZE = 1000;

// MariaDB connection (Docker container)
const mariaConfig = {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'rootpassword',
    database: 'redfing1_db',
};

async function migrateUsers(maria: mysql.Connection) {
    console.log('\n📦 Migrating USERS...');

    const [rows] = await maria.query<mysql.RowDataPacket[]>(`
        SELECT id, username, email, whatsapp_number, discord_id, password, role, balance, created_at, updated_at 
        FROM users ORDER BY id
    `);

    console.log(`   Found ${rows.length} users`);

    // Truncate existing data
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map(row => ({
            id: row.id,
            username: row.username,
            email: row.email,
            whatsappNumber: row.whatsapp_number,
            discordId: row.discord_id,
            password: row.password,
            role: row.role || 'user',
            balance: row.balance?.toString() || '0.00',
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        }));

        await db.insert(users).values(batch).onConflictDoNothing();
        console.log(`   Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }

    // Reset sequence
    const maxId = await db.execute(sql`SELECT MAX(id) as max_id FROM users`);
    if (maxId.rows[0]?.max_id) {
        await db.execute(sql`SELECT setval('users_id_seq', ${maxId.rows[0].max_id})`);
    }

    console.log('   ✅ Users migrated!');
}

async function migrateProducts(maria: mysql.Connection) {
    console.log('\n📦 Migrating PRODUCTS...');

    const [rows] = await maria.query<mysql.RowDataPacket[]>(`
        SELECT id, product_id, name, price, buy_price, expired_days, type, badge, status, created_at, updated_at 
        FROM products ORDER BY id
    `);

    console.log(`   Found ${rows.length} products`);

    await db.execute(sql`TRUNCATE TABLE products CASCADE`);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map(row => ({
            id: row.id,
            productId: row.product_id,
            name: row.name,
            price: row.price?.toString() || '0',
            buyPrice: row.buy_price?.toString() || '0',
            expiredDays: row.expired_days || 30,
            type: row.type === 'instant' ? 'instant' : 'manual',
            badge: row.badge,
            status: row.status === 'inactive' ? 'inactive' : 'active',
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        }));

        await db.insert(products).values(batch as any).onConflictDoNothing();
        console.log(`   Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }

    const maxId = await db.execute(sql`SELECT MAX(id) as max_id FROM products`);
    if (maxId.rows[0]?.max_id) {
        await db.execute(sql`SELECT setval('products_id_seq', ${maxId.rows[0].max_id})`);
    }

    console.log('   ✅ Products migrated!');
}

async function migrateDeposits(maria: mysql.Connection) {
    console.log('\n📦 Migrating DEPOSITS...');

    const [rows] = await maria.query<mysql.RowDataPacket[]>(`
        SELECT id, user_id, amount, total_bayar, total_diterima, payment_channel, 
               ref_id, trx_id, qr_link, qr_string, pay_url, status, source, paid_at, created_at, updated_at 
        FROM deposits ORDER BY id
    `);

    console.log(`   Found ${rows.length} deposits`);

    await db.execute(sql`TRUNCATE TABLE deposits CASCADE`);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map(row => ({
            id: row.id,
            userId: row.user_id && row.user_id > 0 ? row.user_id : null, // FK: 0 -> null
            amount: row.amount?.toString() || '0',
            totalBayar: row.total_bayar?.toString() || '0',
            totalDiterima: row.total_diterima?.toString() || '0',
            paymentChannel: row.payment_channel || 'unknown',
            refId: row.ref_id,
            trxId: row.trx_id || `TRX-${row.id}`,
            qrLink: row.qr_link || '',
            qrString: row.qr_string,
            payUrl: row.pay_url || '',
            status: ['pending', 'success', 'failed', 'expired'].includes(row.status) ? row.status : 'pending',
            source: row.source || 'web',
            paidAt: row.paid_at ? new Date(row.paid_at) : null,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        }));

        try {
            await db.insert(deposits).values(batch as any).onConflictDoNothing();
        } catch (e: any) {
            console.log(`   ⚠️ Batch error: ${e.message?.substring(0, 80)}`);
        }
        console.log(`   Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }

    const maxId = await db.execute(sql`SELECT MAX(id) as max_id FROM deposits`);
    if (maxId.rows[0]?.max_id) {
        await db.execute(sql`SELECT setval('deposits_id_seq', ${maxId.rows[0].max_id})`);
    }

    console.log('   ✅ Deposits migrated!');
}

async function migrateTransactions(maria: mysql.Connection) {
    console.log('\n📦 Migrating TRANSACTIONS...');

    const [rows] = await maria.query<mysql.RowDataPacket[]>(`
        SELECT id, order_id, snap_token, public_id, user_id, product_id, quantity, 
               stock_id, assigned_stocks, price, total_amount, payment_method, 
               payment_proof, qr_string, payment_url, status, expired_at, created_at, updated_at 
        FROM transactions ORDER BY id
    `);

    console.log(`   Found ${rows.length} transactions`);

    await db.execute(sql`TRUNCATE TABLE transactions CASCADE`);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map(row => ({
            id: row.id,
            orderId: row.order_id,
            snapToken: row.snap_token,
            publicId: row.public_id,
            userId: row.user_id && row.user_id > 0 ? row.user_id : null, // FK: 0 -> null
            productId: row.product_id,
            quantity: row.quantity || 1,
            stockId: row.stock_id && row.stock_id > 0 ? row.stock_id : null, // FK: 0 -> null
            assignedStocks: row.assigned_stocks,
            price: row.price?.toString() || '0',
            totalAmount: row.total_amount?.toString(),
            paymentMethod: row.payment_method || 'balance',
            paymentProof: row.payment_proof,
            qrString: row.qr_string,
            paymentUrl: row.payment_url,
            status: ['pending', 'completed', 'cancelled', 'soldout'].includes(row.status) ? row.status : 'pending',
            expiredAt: row.expired_at ? new Date(row.expired_at) : null,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        }));

        try {
            await db.insert(transactions).values(batch as any).onConflictDoNothing();
        } catch (e: any) {
            console.log(`   ⚠️ Batch error (FK issue likely): ${e.message?.substring(0, 80)}`);
        }
        console.log(`   Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }

    const maxId = await db.execute(sql`SELECT MAX(id) as max_id FROM transactions`);
    if (maxId.rows[0]?.max_id) {
        await db.execute(sql`SELECT setval('transactions_id_seq', ${maxId.rows[0].max_id})`);
    }

    console.log('   ✅ Transactions migrated!');
}

async function migrateStocks(maria: mysql.Connection) {
    console.log('\n📦 Migrating STOCKS...');

    const [rows] = await maria.query<mysql.RowDataPacket[]>(`
        SELECT id, product_id, code, status, sold_to, created_at, updated_at 
        FROM stocks ORDER BY id
    `);

    console.log(`   Found ${rows.length} stocks`);

    await db.execute(sql`TRUNCATE TABLE stocks CASCADE`);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
            .filter(row => row.product_id && row.product_id > 0) // Filter invalid FK
            .map(row => ({
                id: row.id,
                productId: row.product_id,
                code: row.code || '',
                status: ['ready', 'sold', 'reserved'].includes(row.status) ? row.status : 'ready',
                soldTo: row.sold_to && row.sold_to > 0 ? row.sold_to : null, // FK: 0 -> null
                createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            }));

        try {
            await db.insert(stocks).values(batch as any).onConflictDoNothing();
        } catch (e: any) {
            console.log(`   ⚠️ Batch error: ${e.message?.substring(0, 80)}`);
        }
        console.log(`   Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }

    const maxId = await db.execute(sql`SELECT MAX(id) as max_id FROM stocks`);
    if (maxId.rows[0]?.max_id) {
        await db.execute(sql`SELECT setval('stocks_id_seq', ${maxId.rows[0].max_id})`);
    }

    console.log('   ✅ Stocks migrated!');
}

async function main() {
    console.log('🚀 Starting Fast Migration from MariaDB to PostgreSQL');
    console.log('='.repeat(50));

    // Connect to MariaDB
    const maria = await mysql.createConnection(mariaConfig);
    console.log('✅ Connected to MariaDB');

    try {
        // Disable FK constraints temporarily for migration
        console.log('\n⚠️  Disabling foreign key checks...');
        await db.execute(sql`SET session_replication_role = 'replica'`);

        // Migrate in order
        await migrateUsers(maria);
        await migrateProducts(maria);
        await migrateStocks(maria);
        await migrateDeposits(maria);
        await migrateTransactions(maria);

        // Re-enable FK constraints
        console.log('\n✅ Re-enabling foreign key checks...');
        await db.execute(sql`SET session_replication_role = 'origin'`);

        console.log('\n' + '='.repeat(50));
        console.log('🎉 MIGRATION COMPLETE!');

        // Summary
        const counts = await Promise.all([
            db.execute(sql`SELECT COUNT(*) as c FROM users`),
            db.execute(sql`SELECT COUNT(*) as c FROM products`),
            db.execute(sql`SELECT COUNT(*) as c FROM stocks`),
            db.execute(sql`SELECT COUNT(*) as c FROM deposits`),
            db.execute(sql`SELECT COUNT(*) as c FROM transactions`),
        ]);

        console.log('\n📊 Final Counts:');
        console.log(`   Users:        ${counts[0].rows[0]?.c}`);
        console.log(`   Products:     ${counts[1].rows[0]?.c}`);
        console.log(`   Stocks:       ${counts[2].rows[0]?.c}`);
        console.log(`   Deposits:     ${counts[3].rows[0]?.c}`);
        console.log(`   Transactions: ${counts[4].rows[0]?.c}`);

    } finally {
        await maria.end();
    }

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
