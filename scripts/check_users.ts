
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { count } from "drizzle-orm";

async function main() {
    const res = await db.select({ count: count() }).from(users);
    console.log("Users count:", res[0].count);
    process.exit(0);
}
main();
