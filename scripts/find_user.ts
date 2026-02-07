import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { like, or } from "drizzle-orm";

async function searchBotUser() {
    try {
        const botUsers = await db.query.users.findMany({
            where: or(
                like(users.username, "%Cia%"),
                like(users.username, "%Bot%"),
                like(users.username, "%System%")
            )
        });
        console.log("Bot/System users found:", JSON.stringify(botUsers, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

searchBotUser();
