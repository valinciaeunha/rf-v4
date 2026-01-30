
import { db } from "../src/lib/db";
import { products, productSpecifications } from "../src/lib/db/schema";

async function seed() {
    console.log("Seeding products...");

    const productsData = [
        {
            id: 1,
            productId: 'RFCD-7D',
            name: 'VIP - REDEM CODE 7D ALL VERSI ANDROID',
            price: '19000.00',
            buyPrice: '18275.00',
            expiredDays: 7,
            type: 'instant' as const,
            badge: 'Popular',
            status: 'active' as const,
        },
        {
            id: 2,
            productId: 'RFCD-30D',
            name: 'VIP - REDEM CODE 30D ALL VERSI ANDROID',
            price: '60000.00',
            buyPrice: '54400.00',
            expiredDays: 30,
            type: 'instant' as const,
            badge: '',
            status: 'active' as const,
        },
        {
            id: 29,
            productId: 'SG - READY',
            name: 'SIAP PAKAI SERVER SINGAPORE',
            price: '25000.00',
            buyPrice: '0.00',
            expiredDays: 7,
            type: 'manual' as const,
            badge: '',
            status: 'inactive' as const,
        },
        {
            id: 34,
            productId: 'KVIP-7D',
            name: 'KVIP - REDEM CODE 7D ALL VERSI ANDROID',
            price: '34000.00',
            buyPrice: '32300.00',
            expiredDays: 7,
            type: 'instant' as const,
            badge: '',
            status: 'active' as const,
        },
        {
            id: 35,
            productId: 'KVIP-30D',
            name: 'KVIP - REDEM CODE 30D ALL VERSI ANDROID',
            price: '98000.00',
            buyPrice: '92650.00',
            expiredDays: 30,
            type: 'instant' as const,
            badge: 'Best Value',
            status: 'active' as const,
        },
    ];

    // Using onConflictDoUpdate to allow re-running seed without errors,
    // or just insert since tables should be empty or we want to ensure these exist.
    // Drizzle's easy insert:
    await db.insert(products).values(productsData).onConflictDoNothing();

    console.log("Seeding product specifications...");

    const specsData = [
        // Product 35
        { productId: 35, iconType: 'cpu', label: '8 core cpu', displayOrder: 1, isActive: true },
        { productId: 35, iconType: 'os', label: 'ALL VERSI ANDROID', displayOrder: 2, isActive: true },
        { productId: 35, iconType: 'ram', label: '6G RAM', displayOrder: 3, isActive: true },
        { productId: 35, iconType: 'storage', label: '80G ROM', displayOrder: 4, isActive: true },
        { productId: 35, iconType: 'bit', label: '64 BIT', displayOrder: 5, isActive: true },
        { productId: 35, iconType: 'chipset', label: 'Qualcomm', displayOrder: 6, isActive: true },
        // Product 1
        { productId: 1, iconType: 'cpu', label: '8 core cpu', displayOrder: 1, isActive: true },
        { productId: 1, iconType: 'os', label: 'ALL VERSI ANDROID', displayOrder: 2, isActive: true },
        { productId: 1, iconType: 'ram', label: '4G RAM', displayOrder: 3, isActive: true },
        { productId: 1, iconType: 'storage', label: '64G ROM', displayOrder: 4, isActive: true },
        { productId: 1, iconType: 'bit', label: '64 BIT', displayOrder: 5, isActive: true },
        { productId: 1, iconType: 'chipset', label: 'Qualcomm', displayOrder: 6, isActive: true },
        // Product 2
        { productId: 2, iconType: 'cpu', label: '8 core cpu', displayOrder: 1, isActive: true },
        { productId: 2, iconType: 'os', label: 'ALL VERSI ANDROID', displayOrder: 2, isActive: true },
        { productId: 2, iconType: 'ram', label: '4G RAM', displayOrder: 3, isActive: true },
        { productId: 2, iconType: 'storage', label: '64G ROM', displayOrder: 4, isActive: true },
        { productId: 2, iconType: 'bit', label: '64 BIT', displayOrder: 5, isActive: true },
        { productId: 2, iconType: 'chipset', label: 'Qualcomm', displayOrder: 6, isActive: true },
        // Product 34
        { productId: 34, iconType: 'cpu', label: '8 core cpu', displayOrder: 1, isActive: true },
        { productId: 34, iconType: 'os', label: 'ALL VERSI ANDROID', displayOrder: 2, isActive: true },
        { productId: 34, iconType: 'ram', label: '6G RAM', displayOrder: 3, isActive: true },
        { productId: 34, iconType: 'storage', label: '80G ROM', displayOrder: 4, isActive: true },
        { productId: 34, iconType: 'bit', label: '64 BIT', displayOrder: 5, isActive: true },
        { productId: 34, iconType: 'chipset', label: 'Qualcomm', displayOrder: 6, isActive: true },
        // Product 29
        { productId: 29, iconType: 'cpu', label: '8 core cpu', displayOrder: 1, isActive: true },
        { productId: 29, iconType: 'os', label: 'Android 12', displayOrder: 2, isActive: true },
        { productId: 29, iconType: 'ram', label: '4G RAM', displayOrder: 3, isActive: true },
        { productId: 29, iconType: 'storage', label: '64G ROM', displayOrder: 4, isActive: true },
        { productId: 29, iconType: 'bit', label: '64 BIT', displayOrder: 5, isActive: true },
        { productId: 29, iconType: 'chipset', label: 'Qualcomm', displayOrder: 6, isActive: true },
    ];

    // Bulk insert specs
    await db.insert(productSpecifications).values(specsData).onConflictDoNothing();

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
