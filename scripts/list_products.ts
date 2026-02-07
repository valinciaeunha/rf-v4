import { db } from "../src/lib/db"
import { products } from "../src/lib/db/schema"
import { limit } from "drizzle-orm"

async function listProducts() {
    const list = await db.query.products.findMany({
        limit: 10
    })
    console.log("Products Sample:", list)
}

listProducts().catch(console.error).finally(() => process.exit())
