"use server"

import { db } from "@/lib/db"
import { transactions, products, deposits } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getSessionUser } from "@/lib/actions/auth"
import { PAYMENT_TIMEOUT_MINUTES } from "@/lib/payment-config"

export async function getHistory() {
    const session = await getSessionUser()
    if (!session) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Fetch Product Purchases from Transactions
        const purchaseHistory = await db
            .select({
                id: transactions.id,
                orderId: transactions.orderId,
                updatedAt: transactions.updatedAt,
                createdAt: transactions.createdAt,
                expiredAt: transactions.expiredAt,
                productName: products.name,
                price: transactions.totalAmount, // Use totalAmount for the actual transaction value
                status: transactions.status,
                assignedStocks: transactions.assignedStocks,
            })
            .from(transactions)
            .innerJoin(products, eq(transactions.productId, products.id))
            .where(eq(transactions.userId, session.id))
            .orderBy(desc(transactions.updatedAt));

        const productsData = purchaseHistory.map((item) => ({
            id: item.orderId || `INV-${item.id.toString().padStart(6, '0')}`,
            date: new Date(item.updatedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
            }).replace(",", " -"),
            amount: new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(Number(item.price || 0)),
            status: item.status.charAt(0).toUpperCase() + item.status.slice(1), // Capitalize status
            product: item.productName,
            code: item.assignedStocks ? JSON.parse(item.assignedStocks) : "Processed", // Handle potential JSON or string
            // For pending payments
            expiresAt: item.expiredAt ? item.expiredAt.toISOString() : new Date(new Date(item.createdAt).getTime() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString(),
        }));

        // Fetch Deposits
        const depositsHistory = await db
            .select()
            .from(deposits)
            .where(eq(deposits.userId, session.id))
            .orderBy(desc(deposits.createdAt));

        const depositsData = depositsHistory.map((item) => ({
            id: item.trxId || `DEP-${item.id.toString().padStart(6, '0')}`,
            depositId: item.id, // Add actual deposit ID for payment link
            date: new Date(item.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
            }).replace(",", " -"),
            amount: new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(Number(item.amount)),
            totalBayar: Number(item.totalBayar || item.amount),
            status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
            method: item.paymentChannel?.replace(/_/g, " ") || "Unknown",
            payUrl: item.payUrl || "",
            qrLink: item.qrLink || "",
            qrString: item.qrString || "",
            // Calculate expiresAt using env config
            expiresAt: new Date(new Date(item.createdAt).getTime() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString(),
        }));

        return {
            success: true,
            data: {
                products: productsData,
                deposits: depositsData
            }
        }

    } catch (error) {
        console.error("Failed to specific history:", error)
        return { success: false, error: "Failed to fetch history" }
    }
}
