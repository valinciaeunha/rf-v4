"use server"

import { db } from "@/lib/db"
import { stocks, products } from "@/lib/db/schema"
import { desc, eq, count, inArray, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { verifyAdmin } from "./admin"

export async function getAdminProductStocks(
    productId: number,
    page: number = 1,
    limit: number = 20
) {
    await verifyAdmin()

    const offset = (page - 1) * limit

    // Get total count
    const totalResult = await db
        .select({ count: count() })
        .from(stocks)
        .where(eq(stocks.productId, productId))

    const total = totalResult[0]?.count || 0

    // Get stocks
    const stockList = await db
        .select()
        .from(stocks)
        .where(eq(stocks.productId, productId))
        .orderBy(desc(stocks.createdAt))
        .limit(limit)
        .offset(offset)

    return {
        data: stockList,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export async function addStock(productId: number, rawCodes: string) {
    await verifyAdmin()

    // 1. Parse and deduplicate input locally
    const inputCodes = Array.from(new Set(
        rawCodes.split('\n').map(c => c.trim()).filter(c => c.length > 0)
    ))

    if (inputCodes.length === 0) {
        return { success: false, error: "Tidak ada kode stock yang valid" }
    }

    try {
        // 2. Check for existing codes for this product
        // Note: Chunk queries if input is huge (e.g. > 1000 items) to avoid max parameter limits, 
        // but for < 1000 items inArray is fine. For now assuming reasonable batch size from UI.

        const existingStocks = await db
            .select({ code: stocks.code })
            .from(stocks)
            .where(
                and(
                    eq(stocks.productId, productId),
                    inArray(stocks.code, inputCodes)
                )
            )

        const existingSet = new Set(existingStocks.map(s => s.code))
        const newCodes = inputCodes.filter(c => !existingSet.has(c))

        if (newCodes.length === 0) {
            return { success: false, error: "Semua kode yang diinput sudah ada di database." }
        }

        // 3. Insert unique codes
        const values = newCodes.map(code => ({
            productId,
            code,
            status: "ready" as const,
        }))

        // Insert in batches if needed, but for now single insert
        // Drizzle handles multiple values efficiently
        // Split into chunks if really large (Postgres max params is 65535)
        const CHUNK_SIZE = 5000
        for (let i = 0; i < values.length; i += CHUNK_SIZE) {
            await db.insert(stocks).values(values.slice(i, i + CHUNK_SIZE))
        }

        revalidatePath(`/admin/products/${productId}/stocks`)
        revalidatePath("/admin/products")

        const duplicateCount = inputCodes.length - newCodes.length
        const message = duplicateCount > 0
            ? `Berhasil: ${newCodes.length}. Duplikat dilewati: ${duplicateCount}.`
            : `Berhasil menambahkan ${newCodes.length} stock`

        return { success: true, count: newCodes.length, message }
    } catch (error) {
        console.error("Failed to add stocks:", error)
        return { success: false, error: "Gagal menambahkan stock" }
    }
}

export async function deleteStock(stockId: number, productId: number) {
    await verifyAdmin()

    try {
        await db.delete(stocks).where(eq(stocks.id, stockId))

        revalidatePath(`/admin/products/${productId}/stocks`)
        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete stock:", error)
        return { success: false, error: "Gagal menghapus stock" }
    }
}

export async function getProductSimple(productId: number) {
    await verifyAdmin()

    const [product] = await db
        .select({
            id: products.id,
            name: products.name,
            productId: products.productId,
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1)

    return product
}
