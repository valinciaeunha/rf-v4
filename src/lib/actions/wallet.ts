"use server"

import { getSessionUser } from "@/lib/actions/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getWalletBalance() {
    try {
        const session = await getSessionUser()
        if (!session) return { success: false, error: "Unauthorized" }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.id),
            columns: {
                balance: true
            }
        })

        if (!user) return { success: false, error: "User not found" }

        return { success: true, data: { balance: user.balance } }
    } catch (error) {
        console.error("Error fetching wallet balance:", error)
        return { success: false, error: "Failed to fetch balance" }
    }
}
