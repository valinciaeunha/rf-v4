
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function testAmount() {
    const { checkTokopayOrderStatus } = await import("@/lib/tokopay")

    console.log("Checking with 1000 (wrong):")
    const res1 = await checkTokopayOrderStatus("ORD-6-31011648-8BE0", undefined, 1000, "QRIS")
    console.log("Res 1:", JSON.stringify(res1, null, 2))

    console.log("\nChecking with 1017 (correct):")
    const res2 = await checkTokopayOrderStatus("ORD-6-31011648-8BE0", undefined, 1017, "QRIS")
    console.log("Res 2:", JSON.stringify(res2, null, 2))
}
testAmount()
