
import { db } from "../src/lib/db";
import { transactions, users } from "../src/lib/db/schema";
import { eq, or, like } from "drizzle-orm";

async function main() {
    const targetOrder = "ORD-16926-06021603-QCBJ";
    console.log(`Searching for order: "${targetOrder}"`);

    // 1. Direct Exact Match
    const exact = await db.query.transactions.findFirst({
        where: eq(transactions.orderId, targetOrder),
        with: {
            user: true
        }
    });

    if (exact) {
        console.log("✅ FOUND EXACT MATCH:");
        console.log(JSON.stringify(exact, null, 2));
    } else {
        console.log("❌ Exact match NOT found.");
    }

    // 2. Like Match (in case of whitespace)
    const similar = await db.query.transactions.findMany({
        where: like(transactions.orderId, `%${targetOrder.substring(0, 10)}%`),
        limit: 5
    });

    console.log(`\nFound ${similar.length} similar orders:`);
    similar.forEach(t => console.log(`- ID: ${t.id} | OrderID: [${t.orderId}] | UserID: ${t.userId}`));

    // 3. Check simple query logic simulation
    console.log("\nSimulating Tool Logic:");
    const isGuest = true;
    const trxIdOrOrderId = targetOrder;

    // Manual query construction test
    // We can't fully simulate tool function here without copying it, but the key is the query.
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
