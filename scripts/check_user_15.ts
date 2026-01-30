
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const user = await db.select().from(users).where(eq(users.id, 15));
    console.log("User 15:", user);
    process.exit(0);
}
main();
