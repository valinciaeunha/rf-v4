"use server";

import { db } from "@/lib/db";
import { users, transactions, deposits, products, stocks, tickets as ticketsSchema } from "@/lib/db/schema";
import { eq, desc, ilike, and, sql, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Helper to format date to WIB string for AI
 */
function formatToWIB(date: Date | string | null) {
    if (!date) return "Unknown";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-') + " WIB";
}

/**
 * Helper to format price to clean IDR string (no .00)
 */
function formatToIDR(amount: number | string | null) {
    if (amount === null || amount === undefined) return "0";
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

/**
 * Check stock availability for a product
 */
export async function checkProductStock(query: string) {
    try {
        const productList = await db.query.products.findMany({
            where: ilike(products.name, `%${query}%`),
            limit: 5
        });

        if (productList.length === 0) return [];

        const results = [];
        for (const p of productList) {
            const [count] = await db
                .select({ count: sql<number>`count(*)` })
                .from(stocks)
                .where(and(eq(stocks.productId, p.id), eq(stocks.status, 'ready')));

            results.push({
                id: p.id,
                name: p.name,
                price: p.price,
                readyStock: Number(count.count),
                type: p.type
            });
        }

        return results;
    } catch (e) {
        console.error("Tool Error: checkProductStock", e);
        return [];
    }
}



/**
 * Get recent transactions for a user
 */
export async function getUserTransactions(userId: number, limit = 5) {
    try {
        // If guest (userId -1), we cannot list "My Transactions".
        if (userId === -1) return [];

        const history = await db.query.transactions.findMany({
            where: eq(transactions.userId, userId),
            orderBy: [desc(transactions.createdAt)],
            limit: limit,
            with: {
                product: {
                    columns: { name: true, productId: true }
                }
            }
        });

        // Status yang diizinkan menampilkan kode
        const ALLOWED_CODE_STATUS = ['success', 'completed', 'delivered'];

        return history.map((t: any) => {
            const canShowCodes = ALLOWED_CODE_STATUS.includes(t.status?.toLowerCase());
            return {
                id: t.id,
                orderId: t.orderId,
                price: formatToIDR(t.totalAmount),
                status: t.status,
                quantity: t.quantity || 1,
                product: t.product?.name || "Unknown",
                // SECURITY: Jangan kirim kode untuk transaksi expired/cancelled/failed
                codes: canShowCodes && t.assignedStocks
                    ? t.assignedStocks.split('\n').filter((c: string) => c.trim())
                    : [],
                date: formatToWIB(t.createdAt)
            };
        });
    } catch (e) {
        console.error("Tool Error: getUserTransactions", e);
        return [];
    }
}

/**
 * Get distinct pending transactions
 */
export async function getPendingTransactions(userId: number) {
    const [orders, allDeposits] = await Promise.all([
        getUserTransactions(userId, 10),
        getUserDeposits(userId, 10)
    ]);

    const pendingOrders = orders.filter((t: any) => t.status === 'pending');
    const pendingDeposits = allDeposits.filter((d: any) => d.status === 'pending');

    if (pendingOrders.length === 0 && pendingDeposits.length === 0) {
        return "No pending transactions or deposits found.";
    }

    return {
        pendingOrders,
        pendingDeposits,
        message: `Found ${pendingOrders.length} pending orders and ${pendingDeposits.length} pending deposits.`
    };
}

/**
 * Get user profile summary
 */
export async function getUserProfile(userId: number) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                id: true,
                username: true,
                email: true,
                balance: true,
                role: true,
                createdAt: true
            }
        });
        if (user) {
            return {
                ...user,
                balance: formatToIDR(user.balance)
            };
        }
        return user;
    } catch (e) {
        console.error("Tool Error: getUserProfile", e);
        return null;
    }
}

/**
 * Get detailed info for a specific transaction (Protected by userId)
 */
export async function getTransactionDetail(trxIdOrOrderId: string, userId: number) {
    try {
        const isGuest = userId === -1;

        const conditions = [
            or(
                eq(transactions.orderId, trxIdOrOrderId),
                eq(transactions.id, isNaN(Number(trxIdOrOrderId)) ? -1 : Number(trxIdOrOrderId))
            )
        ];

        // SECURITY: If not guest, strict userId match
        if (!isGuest) {
            conditions.push(eq(transactions.userId, userId));
        }

        const trx = await db.query.transactions.findFirst({
            where: and(...conditions),
            with: {
                product: true,
                user: { columns: { username: true } }
            }
        });

        if (!trx) return "Transaction not found or you don't have permission to view it.";

        // Status yang diizinkan menampilkan kode
        const ALLOWED_CODE_STATUS = ['success', 'completed', 'delivered'];

        // SECURITY: Hanya tampilkan kode jika bukan Guest DAN status valid
        const canShowCodes = !isGuest && ALLOWED_CODE_STATUS.includes(trx.status?.toLowerCase());

        return {
            id: trx.id,
            orderId: trx.orderId,
            product: trx.product?.name,
            quantity: trx.quantity || 1,
            price: formatToIDR(trx.totalAmount),
            status: trx.status,
            customer: isGuest ? "Hidden (Guest View)" : trx.user?.username,
            // SECURITY: Jangan kirim kode untuk transaksi expired/cancelled/failed ATAU Guest
            codes: canShowCodes && trx.assignedStocks
                ? trx.assignedStocks.split('\n').filter((c: string) => c.trim())
                : [],
            date: formatToWIB(trx.createdAt),
            deliveryStatus: (trx.assignedStocks && ALLOWED_CODE_STATUS.includes(trx.status?.toLowerCase()))
                ? "Product delivered"
                : "Pending delivery"
        };
    } catch (e) {
        console.error("Tool Error: getTransactionDetail", e);
        return "Error fetching detail.";
    }
}

/**
 * Get recent deposits
 */
export async function getUserDeposits(userId: number, limit = 5) {
    try {
        const history = await db.query.deposits.findMany({
            where: eq(deposits.userId, userId),
            orderBy: [desc(deposits.createdAt)],
            limit: limit
        });

        return history.map((d: any) => ({
            id: d.id,
            trxId: d.trxId,
            amountRequested: formatToIDR(d.amount),
            totalBayar: formatToIDR(d.totalBayar),
            totalDiterima: formatToIDR(d.totalDiterima),
            status: d.status,
            paymentChannel: d.paymentChannel,
            source: d.source || "web",
            // Use local payment page URL instead of direct Tokopay URL
            payUrl: d.status === 'pending'
                ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://redfinger.id'}/payment/${d.trxId}`
                : null,
            createdAt: formatToWIB(d.createdAt),
            paidAt: d.paidAt ? formatToWIB(d.paidAt) : null
        }));
    } catch (e) {
        console.error("Tool Error: getUserDeposits", e);
        return [];
    }
}

/**
 * Close a ticket
 */
export async function closeTicket(ticketId: number) {
    try {
        console.log(`[Tool] 🚪 Attempting to close ticket #${ticketId}`);
        const result = await db.update(ticketsSchema).set({ status: 'closed' }).where(eq(ticketsSchema.id, ticketId)).returning();

        if (result.length === 0) {
            console.error(`[Tool] ❌ Failed to close ticket #${ticketId}: Ticket not found or update failed`);
            return { success: false, message: "Ticket not found." };
        }

        console.log(`[Tool] ✅ Ticket #${ticketId} closed successfully in DB`);

        // Broadcast status update
        const { redis } = await import("@/lib/db");
        await redis.publish(`ticket:${ticketId}`, JSON.stringify({
            type: "status_update",
            status: "closed"
        }));

        // Broadcast List Update
        if (result[0]) {
            const listPayload = JSON.stringify({ ticketId, type: "list_update" });
            await redis.publish(`user:${result[0].userId}:tickets`, listPayload);
            await redis.publish(`admin:tickets`, listPayload);
        }

        revalidatePath(`/support/${ticketId}`);
        revalidatePath(`/admin/tickets/${ticketId}`);

        return { success: true, message: "Ticket marked as closed." };
    } catch (e) {
        console.error("Tool Error: closeTicket", e);
        return { success: false };
    }
}

/**
 * Disable AI for this ticket (When user asks for human staff)
 */
export async function disableAi(ticketId: number) {
    try {
        console.log(`[Tool] 🤖 Disabling AI for ticket #${ticketId}`);
        const result = await db.update(ticketsSchema)
            .set({ aiEnabled: false, status: 'open' })
            .where(eq(ticketsSchema.id, ticketId))
            .returning();

        // Broadcast to stop AI thinking in UI
        const { redis } = await import("@/lib/db");
        await redis.publish(`ticket:${ticketId}`, JSON.stringify({
            type: "ai_disabled",
            ticketId
        }));

        // Broadcast Status Update (Back to OPEN for Admin attention)
        await redis.publish(`ticket:${ticketId}`, JSON.stringify({
            type: "status_update",
            status: "open"
        }));

        // Broadcast List Update
        if (result[0]) {
            const listPayload = JSON.stringify({ ticketId, type: "list_update" });
            await redis.publish(`user:${result[0].userId}:tickets`, listPayload);
            await redis.publish(`admin:tickets`, listPayload);
        }

        revalidatePath(`/support/${ticketId}`);
        revalidatePath(`/admin/tickets/${ticketId}`);

        return { success: true, message: "AI has been disabled. Human staff will take over." };
    } catch (e) {
        console.error("Tool Error: disableAi", e);
        return { success: false };
    }
}

/**
 * Get all available products
 */
export async function getAllProducts() {
    try {
        const productList = await db.query.products.findMany({
            orderBy: [desc(products.price)]
        });

        const stockCounts = await db.select({
            productId: stocks.productId,
            count: sql<number>`count(*)`
        })
            .from(stocks)
            .where(eq(stocks.status, 'ready')) // Correct status is 'ready'
            .groupBy(stocks.productId);

        const stockMap = new Map(stockCounts.map(s => [s.productId, Number(s.count)]));

        return {
            type: "product_list",
            data: {
                products: productList.map(p => ({
                    name: p.name,
                    price: formatToIDR(p.price),
                    stock: stockMap.get(p.id) || 0,
                    variant: p.name.includes('KVIP') ? 'KVIP' : 'VIP'
                }))
            }
        };
    } catch (e) {
        console.error("Tool Error: getAllProducts", e);
        return { type: "product_list", data: { products: [] } };
    }
}
