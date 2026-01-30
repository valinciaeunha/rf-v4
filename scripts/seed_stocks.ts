
import { db } from "../src/lib/db";
import { stocks } from "../src/lib/db/schema";
import { sql } from "drizzle-orm";

async function seed() {
    console.log("Seeding stocks...");

    const stocksData = [
        { id: 223, productId: 2, code: 'HcFIE03M', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 224, productId: 2, code: '79FcIX1j', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 225, productId: 2, code: 'MO6Y4HTH', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 226, productId: 2, code: '37bf4JYm', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 227, productId: 2, code: 'HP2FTzlH', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 228, productId: 2, code: '4cyymQlM', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 229, productId: 2, code: 'OVTZWeda', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 230, productId: 2, code: 'IvpbnN3k', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 231, productId: 2, code: 'uhhB4y5D', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 232, productId: 2, code: 'I7jIn9lw', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:05:07') },
        { id: 233, productId: 2, code: 'iAe3dzuY', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:09:38') },
        { id: 247, productId: 2, code: 'Hj5whC1v', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:21:30') },
        { id: 253, productId: 2, code: 'DHcM6qZF', status: 'sold', soldTo: 15, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:25:36') },
        { id: 256, productId: 2, code: 'fwkIMHhY', status: 'sold', soldTo: 6, createdAt: new Date('2025-10-13 16:04:40'), updatedAt: new Date('2025-10-13 16:22:39') },
        { id: 323, productId: 1, code: '7G7A-3VTE-8TGQ', status: 'sold', soldTo: 30, createdAt: new Date('2025-10-14 01:37:47'), updatedAt: new Date('2025-10-14 01:45:11') },
        { id: 324, productId: 1, code: 'YDRQ-6LGW-8B6A', status: 'sold', soldTo: 31, createdAt: new Date('2025-10-14 01:37:47'), updatedAt: new Date('2025-10-14 01:47:46') },
        // Add some 'ready' stocks (mocked based on pattern if not in dump snippet, or explicit)
        // Creating some dummy ready stocks for testing
        { id: 1001, productId: 1, code: 'READY-CODE-1', status: 'ready', soldTo: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 1002, productId: 1, code: 'READY-CODE-2', status: 'ready', soldTo: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 1003, productId: 2, code: 'READY-CODE-3', status: 'ready', soldTo: null, createdAt: new Date(), updatedAt: new Date() },
    ] as any[]; // Cast to avoid strict type issues with date strings / partials

    // We use onConflictDoNothing
    await db.insert(stocks).values(stocksData).onConflictDoNothing();

    // Reset sequence if needed (optional for postgres)
    // await db.execute(sql`SELECT setval('stocks_id_seq', (SELECT MAX(id) FROM stocks))`);

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
