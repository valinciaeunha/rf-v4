
import { db } from "../src/lib/db";
import { stocks } from "../src/lib/db/schema";
import { count, sql } from "drizzle-orm";

async function main() {
    const res = await db.select({ count: count() }).from(stocks);
    console.log("Stocks count:", res[0].count);

    // Check distribution
    const readyRes = await db.select({ count: count() }).from(stocks).where(sql`${stocks.status} = 'ready'`);
    console.log("Ready stocks:", readyRes[0].count);

    const soldRes = await db.select({ count: count() }).from(stocks).where(sql`${stocks.status} = 'sold'`);
    console.log("Sold stocks:", soldRes[0].count);

    // Distribution of sold_to
    console.log("Top 10 buyers (sold_to):");
    const buyers = await db.execute(sql`
        SELECT sold_to, COUNT(*) as c 
        FROM stocks 
        WHERE sold_to IS NOT NULL 
        GROUP BY sold_to 
        ORDER BY c DESC 
        LIMIT 10
    `);
    console.log(buyers.rows);

    process.exit(0);
}
main();
