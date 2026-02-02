
import { db } from "../src/lib/db"
import { transactions, deposits } from "../src/lib/db/schema"
import { eq } from "drizzle-orm"

async function main() {
    const orderId = "ORD-6-31011615-LSDJ"
    console.log(`Checking transaction/deposit: ${orderId}`)

    // Check transaction
    const txs = await db.query.transactions.findMany({
        where: eq(transactions.orderId, orderId)
    })

    if (txs.length > 0) {
        console.log(`Found ${txs.length} transactions:`)
        for (const tx of txs) {
            console.log("---")
            console.log("ID:", tx.id)
            console.log("Status:", tx.status)
            console.log("CreatedAt:", tx.createdAt)
            console.log("ExpiredAt:", tx.expiredAt)

            // Check Tokopay Status
            // We need to import checkTokopayOrderStatus dynamically or assume logic
            // Since we can't easily import from src/lib due to alias issues in tsx/script,
            // we will simulate the fetch if possible, or just print credentials to see if loaded.
            console.log("Merchant:", process.env.TOKOPAY_MERCHANT_ID ? "Loaded" : "Missing")
            console.log("Secret:", process.env.TOKOPAY_SECRET ? "Loaded" : "Missing")

            const merchant = process.env.TOKOPAY_MERCHANT_ID
            const secret = process.env.TOKOPAY_SECRET
            const refId = tx.orderId // or refId if deposit
            // For transaction, we use orderId as refId usually?
            // In route.ts: checkTokopayOrderStatus(transaction.orderId, undefined, parseFloat(transaction.price), transaction.paymentMethod)

            if (merchant && secret) {
                const params = new URLSearchParams()
                params.append("merchant", merchant)
                params.append("secret", secret)
                params.append("ref_id", refId!) // orderId is refId for products
                params.append("nominal", parseFloat(tx.price).toString())
                params.append("metode", tx.paymentMethod)

                const url = `https://api.tokopay.id/v1/order?${params.toString()}`
                console.log("Fetch URL:", url.replace(secret, "SECRET"))

                try {
                    const res = await fetch(url)
                    const data = await res.json()
                    console.log("Tokopay Response:", JSON.stringify(data, null, 2))
                } catch (err) {
                    console.error("Tokopay Fetch Error:", err)
                }
            }
        }
    } else {
        console.log("Transactions NOT found")
    }

    process.exit(0)
}

main().catch(console.error)
