
import { db } from "@/lib/db"
import { reviews, users } from "@/lib/db/schema"
import { count } from "drizzle-orm"

async function checkCounts() {
    const reviewCount = await db.select({ count: count() }).from(reviews)
    const userCount = await db.select({ count: count() }).from(users)
    console.log(`Current reviews in DB: ${reviewCount[0].count}`)
    console.log(`Current users in DB: ${userCount[0].count}`)
}

checkCounts().catch(console.error)
