"use server"

import { db } from "@/lib/db"
import { transactions, deposits, products } from "@/lib/db/schema"
import { eq, desc, sql, and, gte } from "drizzle-orm"
import { getSessionUser } from "@/lib/actions/auth"

export interface DashboardStats {
    balance: string
    totalDeposits: string
    totalTransactions: number
    activeProducts: number
}

export interface ChartDataPoint {
    date: string
    transactions: number
    deposits: number
}

export interface RecentActivityItem {
    type: "deposit" | "purchase"
    title: string
    desc: string
    amount: string
    positive: boolean
    paidWithBalance: boolean // true if purchase used balance
    date: Date
}

export async function getDashboardData() {
    const session = await getSessionUser()
    if (!session) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // 1. Get user's current balance
        const balanceFormatted = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(Number(session.balance || 0))

        // 2. Get total successful deposits
        const totalDepositsResult = await db
            .select({
                total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`,
            })
            .from(deposits)
            .where(
                and(
                    eq(deposits.userId, session.id),
                    eq(deposits.status, "success")
                )
            )
        const totalDeposits = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(Number(totalDepositsResult[0]?.total || 0))

        // 3. Get transaction stats (total, success, expired)
        const transactionStatsResult = await db
            .select({
                total: sql<number>`COUNT(*)`,
                success: sql<number>`SUM(CASE WHEN ${transactions.status} = 'success' THEN 1 ELSE 0 END)`,
                expired: sql<number>`SUM(CASE WHEN ${transactions.status} = 'expired' THEN 1 ELSE 0 END)`,
            })
            .from(transactions)
            .where(eq(transactions.userId, session.id))

        const totalTransactions = Number(transactionStatsResult[0]?.total || 0)
        const successTransactions = Number(transactionStatsResult[0]?.success || 0)
        const expiredTransactions = Number(transactionStatsResult[0]?.expired || 0)
        const successRate = totalTransactions > 0
            ? Math.round((successTransactions / totalTransactions) * 100)
            : 0

        // 4. Get total spent on products
        const totalSpentResult = await db
            .select({
                total: sql<string>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, session.id),
                    eq(transactions.status, "success")
                )
            )
        const totalSpent = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(Number(totalSpentResult[0]?.total || 0))

        // 5. Get chart data for last 6 months
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const monthlyTransactions = await db
            .select({
                month: sql<string>`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`,
                count: sql<number>`COUNT(*)`,
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, session.id),
                    gte(transactions.createdAt, sixMonthsAgo)
                )
            )
            .groupBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`)

        const monthlyDeposits = await db
            .select({
                month: sql<string>`TO_CHAR(${deposits.createdAt}, 'YYYY-MM')`,
                count: sql<number>`COUNT(*)`,
            })
            .from(deposits)
            .where(
                and(
                    eq(deposits.userId, session.id),
                    gte(deposits.createdAt, sixMonthsAgo)
                )
            )
            .groupBy(sql`TO_CHAR(${deposits.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${deposits.createdAt}, 'YYYY-MM')`)

        // Merge chart data
        const chartDataMap = new Map<string, { transactions: number; deposits: number }>()

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            chartDataMap.set(key, { transactions: 0, deposits: 0 })
        }

        monthlyTransactions.forEach((item) => {
            if (chartDataMap.has(item.month)) {
                chartDataMap.get(item.month)!.transactions = Number(item.count)
            }
        })

        monthlyDeposits.forEach((item) => {
            if (chartDataMap.has(item.month)) {
                chartDataMap.get(item.month)!.deposits = Number(item.count)
            }
        })

        const chartData: ChartDataPoint[] = Array.from(chartDataMap.entries()).map(([date, data]) => ({
            date,
            transactions: data.transactions,
            deposits: data.deposits,
        }))

        // 6. Get recent activity (last 10 items)
        const recentDeposits = await db
            .select({
                id: deposits.id,
                amount: deposits.amount,
                status: deposits.status,
                createdAt: deposits.createdAt,
                paymentChannel: deposits.paymentChannel,
            })
            .from(deposits)
            .where(eq(deposits.userId, session.id))
            .orderBy(desc(deposits.createdAt))
            .limit(5)

        const recentPurchases = await db
            .select({
                id: transactions.id,
                totalAmount: transactions.totalAmount,
                status: transactions.status,
                createdAt: transactions.createdAt,
                productName: products.name,
                paymentMethod: transactions.paymentMethod,
            })
            .from(transactions)
            .innerJoin(products, eq(transactions.productId, products.id))
            .where(eq(transactions.userId, session.id))
            .orderBy(desc(transactions.createdAt))
            .limit(5)

        const recentActivity: RecentActivityItem[] = [
            ...recentDeposits.map((d) => ({
                type: "deposit" as const,
                title: "Top Up Saldo",
                desc: d.paymentChannel?.replace(/_/g, " ") || "Unknown",
                amount: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                }).format(Number(d.amount)),
                positive: d.status === "success",
                paidWithBalance: false, // Deposits don't use balance
                date: d.createdAt,
            })),
            ...recentPurchases.map((p) => ({
                type: "purchase" as const,
                title: p.productName,
                desc: p.paymentMethod === "balance"
                    ? "Bayar dengan Saldo"
                    : p.status === "success" ? "Pembelian Berhasil" : `Status: ${p.status}`,
                amount: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                }).format(Number(p.totalAmount || 0)),
                positive: false,
                paidWithBalance: p.paymentMethod === "balance", // Only balance payments affect saldo
                date: p.createdAt,
            })),
        ]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 7)

        return {
            success: true,
            data: {
                stats: {
                    balance: balanceFormatted,
                    totalDeposits,
                    totalTransactions,
                    successTransactions,
                    expiredTransactions,
                    successRate,
                    totalSpent,
                },
                chartData,
                recentActivity,
            },
        }
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        return { success: false, error: "Failed to fetch dashboard data" }
    }
}
