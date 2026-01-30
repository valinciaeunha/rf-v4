"use server"

import { db } from "@/lib/db"
import { products, productSpecifications, stocks } from "@/lib/db/schema"
import { eq, sql, desc, and } from "drizzle-orm"

export interface ProductData {
    id: number
    productId: string
    name: string
    price: string
    type: "instant" | "manual"
    badge: string | null
    features: { label: string; icon: string }[]
    stock: number
    sold: number // Mock or calculate if possible
    image?: string // Derived or placeholder
    rating: number // Mock
    popular: boolean
    durationDays: number
}

export async function getProducts() {
    try {
        // 1. Fetch active products
        const allProducts = await db.select()
            .from(products)
            .where(eq(products.status, 'active'))
            .orderBy(products.price);

        if (!allProducts.length) {
            return { success: true, data: [] };
        }

        const productIds = allProducts.map(p => p.id);

        // 2. Fetch specifications for these products
        const allSpecs = await db.select()
            .from(productSpecifications)
            .where(and(
                eq(productSpecifications.isActive, true),
                sql`${productSpecifications.productId} IN ${productIds}`
            ))
            .orderBy(productSpecifications.displayOrder);

        // Group specs by product ID
        const specsMap = new Map<number, { label: string; icon: string }[]>();
        allSpecs.forEach(s => {
            const current = specsMap.get(s.productId) || [];
            current.push({ label: s.label, icon: s.iconType });
            specsMap.set(s.productId, current);
        });

        // 3. Fetch stock counts
        const stockCounts = await db.select({
            productId: stocks.productId,
            count: sql<number>`cast(count(${stocks.id}) as int)`
        })
            .from(stocks)
            .where(eq(stocks.status, 'ready'))
            .groupBy(stocks.productId);

        const stockMap = new Map<number, number>();
        stockCounts.forEach(s => stockMap.set(s.productId, s.count));

        // 4. Fetch sold counts
        const soldCounts = await db.select({
            productId: stocks.productId,
            count: sql<number>`cast(count(${stocks.id}) as int)`
        })
            .from(stocks)
            .where(eq(stocks.status, 'sold'))
            .groupBy(stocks.productId);

        const soldMap = new Map<number, number>();
        soldCounts.forEach(s => soldMap.set(s.productId, s.count));

        // 4. Transform to ProductData
        const formattedProducts: ProductData[] = allProducts.map(p => {
            return {
                id: p.id,
                productId: p.productId,
                name: p.name,
                price: p.price,
                type: p.type,
                badge: p.badge,
                features: specsMap.get(p.id) || [],
                stock: stockMap.get(p.id) || 0,
                sold: soldMap.get(p.id) || 0,
                rating: 5.0,
                popular: !!p.badge,
                durationDays: p.expiredDays
            }
        });

        return { success: true, data: formattedProducts };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { success: false, error: "Failed to fetch products" };
    }
}

export async function getProductById(id: string | number) {
    try {
        const productId = typeof id === 'string' ? parseInt(id) : id;
        if (isNaN(productId)) return { success: false, error: "Invalid product ID" };

        // 1. Fetch product
        const product = await db.query.products.findFirst({
            where: eq(products.id, productId)
        });

        if (!product) return { success: false, error: "Product not found" };

        // 2. Fetch specs
        const specs = await db.select()
            .from(productSpecifications)
            .where(and(
                eq(productSpecifications.isActive, true),
                eq(productSpecifications.productId, productId)
            ))
            .orderBy(productSpecifications.displayOrder);

        const features = specs.map(s => ({ label: s.label, icon: s.iconType }));

        // 3. Fetch stock count
        const stockCount = await db.select({ count: sql<number>`cast(count(${stocks.id}) as int)` })
            .from(stocks)
            .where(and(
                eq(stocks.productId, productId),
                eq(stocks.status, 'ready')
            ));

        // 4. Fetch sold count
        const soldCount = await db.select({ count: sql<number>`cast(count(${stocks.id}) as int)` })
            .from(stocks)
            .where(and(
                eq(stocks.productId, productId),
                eq(stocks.status, 'sold')
            ));

        const productData: ProductData = {
            id: product.id,
            productId: product.productId,
            name: product.name,
            price: product.price,
            type: product.type,
            badge: product.badge,
            features,
            stock: stockCount[0]?.count || 0,
            sold: soldCount[0]?.count || 0,
            rating: 5.0,
            popular: !!product.badge,
            durationDays: product.expiredDays
        };

        return { success: true, data: productData };

    } catch (error) {
        console.error("Error fetching product:", error);
        return { success: false, error: "Failed to fetch product" };
    }
}
