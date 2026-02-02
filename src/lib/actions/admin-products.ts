"use server"

import { db } from "@/lib/db"
import { products, productSpecifications, stocks, users, transactions } from "@/lib/db/schema"
import { desc, eq, like, or, count, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { verifyAdmin } from "./admin"
import { getSessionUser } from "./auth"
import { verifyPassword } from "@/lib/auth/password"
import { z } from "zod"

// Validation schemas
const productSchema = z.object({
    productId: z.string().min(1, "Product ID wajib diisi"),
    name: z.string().min(1, "Nama produk wajib diisi"),
    price: z.number().min(0, "Harga tidak boleh negatif"),
    buyPrice: z.number().min(0, "Harga beli tidak boleh negatif").optional().default(0),
    expiredDays: z.number().min(1, "Expired days minimal 1").optional().default(30),
    type: z.enum(["instant", "manual"]).optional().default("manual"),
    badge: z.string().optional().nullable(),
    status: z.enum(["active", "inactive"]).optional().default("active"),
})

const specificationSchema = z.object({
    iconType: z.string().min(1, "Icon type wajib diisi"),
    label: z.string().min(1, "Label wajib diisi"),
    displayOrder: z.number().optional().default(0),
    isActive: z.boolean().optional().default(true),
})

export async function getAdminProducts(
    query: string = "",
    page: number = 1,
    limit: number = 20
) {
    await verifyAdmin()

    const offset = (page - 1) * limit

    const whereClause = query
        ? or(
            like(products.name, `%${query}%`),
            like(products.productId, `%${query}%`)
        )
        : undefined

    // Get total count
    const totalResult = await db
        .select({ count: count() })
        .from(products)
        .where(whereClause)

    const total = totalResult[0]?.count || 0

    // Get products with stock counts
    const productList = await db
        .select({
            id: products.id,
            productId: products.productId,
            name: products.name,
            price: products.price,
            buyPrice: products.buyPrice,
            expiredDays: products.expiredDays,
            type: products.type,
            badge: products.badge,
            status: products.status,
            createdAt: products.createdAt,
            stockCount: sql<number>`COALESCE((SELECT COUNT(*) FROM stocks WHERE stocks.product_id = products.id AND stocks.status = 'ready'), 0)`,
        })
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset)

    return {
        data: productList,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export async function getProductById(id: number) {
    await verifyAdmin()

    const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1)

    if (!product) {
        return { success: false, error: "Produk tidak ditemukan" }
    }

    // Get specifications
    const specs = await db
        .select()
        .from(productSpecifications)
        .where(eq(productSpecifications.productId, id))
        .orderBy(productSpecifications.displayOrder)

    return {
        success: true,
        data: {
            ...product,
            specifications: specs,
        },
    }
}

export async function createProduct(data: z.infer<typeof productSchema>) {
    await verifyAdmin()

    const validation = productSchema.safeParse(data)
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message }
    }

    try {
        // Check if productId already exists
        const existing = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.productId, data.productId))
            .limit(1)

        if (existing.length > 0) {
            return { success: false, error: "Product ID sudah digunakan" }
        }

        const [newProduct] = await db
            .insert(products)
            .values({
                productId: data.productId,
                name: data.name,
                price: String(data.price),
                buyPrice: String(data.buyPrice || 0),
                expiredDays: data.expiredDays || 30,
                type: data.type || "manual",
                badge: data.badge || null,
                status: data.status || "active",
            })
            .returning()

        revalidatePath("/admin/products")
        return { success: true, data: newProduct }
    } catch (error) {
        console.error("Failed to create product:", error)
        return { success: false, error: "Gagal membuat produk" }
    }
}

export async function updateProduct(id: number, data: Partial<z.infer<typeof productSchema>>) {
    await verifyAdmin()

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {}

        if (data.productId !== undefined) updateData.productId = data.productId
        if (data.name !== undefined) updateData.name = data.name
        if (data.price !== undefined) updateData.price = String(data.price)
        if (data.buyPrice !== undefined) updateData.buyPrice = String(data.buyPrice)
        if (data.expiredDays !== undefined) updateData.expiredDays = data.expiredDays
        if (data.type !== undefined) updateData.type = data.type
        if (data.badge !== undefined) updateData.badge = data.badge
        if (data.status !== undefined) updateData.status = data.status

        await db
            .update(products)
            .set(updateData)
            .where(eq(products.id, id))

        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to update product:", error)
        return { success: false, error: "Gagal mengupdate produk" }
    }
}

export async function deleteProduct(id: number, password?: string) {
    if (!password) {
        return { success: false, error: "Password wajib diisi" }
    }

    await verifyAdmin()
    const currentUser = await getSessionUser()

    if (!currentUser || !currentUser.id) {
        return { success: false, error: "Sesi tidak valid" }
    }

    // Ambil fresh data user dari DB untuk verifikasi password
    const userInDb = await db.query.users.findFirst({
        where: eq(users.id, currentUser.id)
    })

    if (!userInDb || !userInDb.password) {
        return { success: false, error: "User tidak memiliki password. Gunakan metode login lainnya." }
    }

    // Verifikasi password
    const isPasswordValid = await verifyPassword(password, userInDb.password)
    if (!isPasswordValid) {
        return { success: false, error: "Password salah" }
    }

    try {
        // FORCE DELETE SEQUENCE
        // 1. Delete associated transactions (FK constraint usually blocks product delete)
        await db.delete(transactions).where(eq(transactions.productId, id))

        // 2. Delete all stocks (safe now that transactions are gone)
        await db.delete(stocks).where(eq(stocks.productId, id))

        // 3. Delete specifications (just in case)
        await db.delete(productSpecifications).where(eq(productSpecifications.productId, id))

        // 4. Finally delete the product
        await db.delete(products).where(eq(products.id, id))

        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete product:", error)
        if (error instanceof Error) {
            return { success: false, error: `Gagal: ${error.message}` }
        }
        return { success: false, error: "Gagal menghapus produk" }
    }
}

// Specifications CRUD
export async function addProductSpecification(
    productId: number,
    data: z.infer<typeof specificationSchema>
) {
    await verifyAdmin()

    const validation = specificationSchema.safeParse(data)
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message }
    }

    try {
        const [spec] = await db
            .insert(productSpecifications)
            .values({
                productId,
                iconType: data.iconType,
                label: data.label,
                displayOrder: data.displayOrder || 0,
                isActive: data.isActive ?? true,
            })
            .returning()

        revalidatePath("/admin/products")
        return { success: true, data: spec }
    } catch (error) {
        console.error("Failed to add specification:", error)
        return { success: false, error: "Gagal menambahkan spesifikasi" }
    }
}

export async function updateProductSpecification(
    id: number,
    data: Partial<z.infer<typeof specificationSchema>>
) {
    await verifyAdmin()

    try {
        await db
            .update(productSpecifications)
            .set(data)
            .where(eq(productSpecifications.id, id))

        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to update specification:", error)
        return { success: false, error: "Gagal mengupdate spesifikasi" }
    }
}

export async function deleteProductSpecification(id: number) {
    await verifyAdmin()

    try {
        await db.delete(productSpecifications).where(eq(productSpecifications.id, id))

        revalidatePath("/admin/products")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete specification:", error)
        return { success: false, error: "Gagal menghapus spesifikasi" }
    }
}
