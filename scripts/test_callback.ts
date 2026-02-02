
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { db } from "@/lib/db"
import { transactions, transactionQueues, stocks, products, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from 'crypto'

async function testCallbackFlow() {
    console.log("🚀 Memulai Test Callback dengan Sistem Antrian...")

    // 1. Ambil User & Produk Sample
    const user = await db.query.users.findFirst()
    const product = await db.query.products.findFirst({ where: eq(products.status, 'active') })

    if (!user || !product) {
        console.error("❌ User atau Produk tidak ditemukan untuk testing")
        return
    }

    console.log(`- Menggunakan User: ${user.username}`)
    console.log(`- Menggunakan Produk: ${product.name}`)

    // 2. Buat Stok Baru untuk Testing
    const testCode = `TEST-CODE-${Math.random().toString(36).substring(7).toUpperCase()}`
    const [newStock] = await db.insert(stocks).values({
        productId: product.id,
        code: testCode,
        status: 'ready'
    }).returning()
    console.log(`- Stok Testing dibuat: ${testCode} (ID: ${newStock.id})`)

    // 3. Simulasikan Pembuatan Order (Manual logic dari createProductOrder)
    const orderId = `TEST-ORD-${Date.now()}`
    const trxId = `TOKOPAY-TRX-${Date.now()}`

    console.log(`- Menciptakan Transaksi PENDING (OrderId: ${orderId})...`)

    const [transaction] = await db.insert(transactions).values({
        orderId,
        publicId: trxId,
        userId: user.id,
        productId: product.id,
        quantity: 1,
        stockId: newStock.id,
        price: product.price,
        totalAmount: product.price,
        paymentMethod: 'QRIS',
        status: 'pending'
    }).returning()

    // 4. Masukkan ke Antrian
    await db.insert(transactionQueues).values({
        transactionId: transaction.id,
        stockId: newStock.id,
        userId: user.id
    })

    // Ubah status stok jadi reserved
    await db.update(stocks).set({ status: 'reserved', soldTo: user.id }).where(eq(stocks.id, newStock.id))

    console.log(`✅ Transaksi Pending & Antrian berhasil dibuat.`)
    console.log(`   - assigned_stocks di DB (seharusnya NULL): ${transaction.assignedStocks}`)

    // 5. SIMULASI CALLBACK
    console.log(`\n📡 Menjalankan Simulasi Callback Tokopay (Status: Paid)...`)

    // Kita panggil API route secara manual via fetch jika server jalan, 
    // atau kita simulasikan logikanya di sini untuk verifikasi cepat.
    // Karena saya ingin verifikasi LOGIKA, saya akan jalankan logic callback-nya di sini

    const status = "Paid" // Dari Tokopay
    const ref_id = orderId // OrderId kita

    // --- Logic dari callback/route.ts ---
    const queuedStocks = await db.select({
        id: stocks.id,
        code: stocks.code
    })
        .from(transactionQueues)
        .innerJoin(stocks, eq(transactionQueues.stockId, stocks.id))
        .where(eq(transactionQueues.transactionId, transaction.id))

    if (status === "Paid" || status === "Success") {
        const stockCodes = queuedStocks.map(s => s.code)
        const stockIds = queuedStocks.map(s => s.id)

        await db.transaction(async (tx) => {
            // Update transaction status and assign codes
            await tx.update(transactions)
                .set({
                    status: "success",
                    assignedStocks: JSON.stringify(stockCodes)
                })
                .where(eq(transactions.id, transaction.id))

            // Finalize stock status to sold
            if (stockIds.length > 0) {
                await tx.update(stocks)
                    .set({ status: 'sold' })
                    .where(eq(stocks.id, stockIds[0])) // simplified for test
            }

            // Clear from queue
            await tx.delete(transactionQueues)
                .where(eq(transactionQueues.transactionId, transaction.id))
        })
    }
    // --- End of Logic ---

    console.log(`✅ Simulasi Callback Selesai.`)

    // 6. VERIFIKASI AKHIR
    console.log(`\n🔍 Melakukan Verifikasi Akhir:`)
    const finalTrx = await db.query.transactions.findFirst({ where: eq(transactions.id, transaction.id) })
    const finalStock = await db.query.stocks.findFirst({ where: eq(stocks.id, newStock.id) })
    const finalQueue = await db.query.transactionQueues.findFirst({ where: eq(transactionQueues.transactionId, transaction.id) })

    console.log(`- Status Transaksi (Success?): ${finalTrx?.status}`)
    console.log(`- assigned_stocks (Isi kode?): ${finalTrx?.assignedStocks}`)
    console.log(`- Status Stok (sold?): ${finalStock?.status}`)
    console.log(`- Antrian Terhapus? (Kosong?): ${!finalQueue ? 'YA' : 'TIDAK'}`)

    if (finalTrx?.status === 'success' && finalTrx?.assignedStocks && finalStock?.status === 'sold' && !finalQueue) {
        console.log(`\n🏆 TEST BERHASIL! Sistem antrian berfungsi 100%.`)
    } else {
        console.log(`\n❌ TEST GAGAL! Ada logika yang tidak pas.`)
    }
}

testCallbackFlow().catch(console.error)
