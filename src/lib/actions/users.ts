'use server';

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { count } from "drizzle-orm";

export async function getUserCount() {
    try {
        const [result] = await db.select({ count: count() }).from(users);
        return result.count;
    } catch (error) {
        console.error('Error fetching user count:', error);
        return 0; // Return 0 or a fallback number on error
    }
}
