
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function debugTokopay() {
    console.log("MH:", process.env.TOKOPAY_MERCHANT_ID)
    const { checkTokopayOrderStatus } = await import("@/lib/tokopay")

    console.log("Checking status for ORD-6-31011648-8BE0")
    try {
        const result = await checkTokopayOrderStatus(
            "ORD-6-31011648-8BE0",
            undefined,
            1017,
            "QRIS"
        )
        console.log("Result:", JSON.stringify(result, null, 2))
    } catch (e) {
        console.error(e)
    }
}
debugTokopay()
