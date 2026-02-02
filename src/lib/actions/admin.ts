"use server"

import { db } from "@/lib/db"
import { users, transactions, deposits, products, stocks } from "@/lib/db/schema"
import { getSessionUser } from "@/lib/actions/auth"
import { desc, asc, count, like, or, eq, sql, getTableColumns, and, inArray, type SQL } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { redirect } from "next/navigation"

export async function verifyAdmin() {
    const session = await getSessionUser()
    if (!session || (session.role !== "admin" && session.role !== "developer")) {
        redirect("/dashboard")
    }
    return session
}

export async function getAdminUsers(
    query?: string,
    page: number = 1,
    limit: number = 10,
    sort: string = "createdAt",
    order: "asc" | "desc" = "desc"
) {
    const session = await verifyAdmin()

    // SECURITY: Validate pagination params to prevent DoS
    const safePage = Math.max(1, Math.floor(page))
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)))

    const offset = (safePage - 1) * safeLimit
    const searchFilter = query
        ? or(
            like(users.username, `%${query}%`),
            like(users.email, `%${query}%`),
            like(users.discordId, `%${query}%`)
        )
        : undefined

    // Define SQL expressions for stats
    const successCount = sql<number>`(SELECT count(*) FROM transactions WHERE transactions.user_id = users.id AND transactions.status = 'success')`.mapWith(Number)
    const failedCount = sql<number>`(SELECT count(*) FROM transactions WHERE transactions.user_id = users.id AND transactions.status = 'failed')`.mapWith(Number)
    const expiredCount = sql<number>`(SELECT count(*) FROM transactions WHERE transactions.user_id = users.id AND transactions.status = 'expired')`.mapWith(Number)
    const totalDeposit = sql<number>`(SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE deposits.user_id = users.id AND deposits.status = 'success')`.mapWith(Number)

    // Determine order by column
    let orderBy
    const direction = order === "asc" ? asc : desc

    switch (sort) {
        case "username":
            orderBy = direction(users.username)
            break
        case "email":
            orderBy = direction(users.email)
            break
        case "role":
            orderBy = direction(users.role)
            break
        case "balance":
            orderBy = direction(users.balance)
            break
        case "successCount":
            orderBy = direction(successCount)
            break
        case "failedCount":
            orderBy = direction(failedCount)
            break
        case "expiredCount":
            orderBy = direction(expiredCount)
            break
        case "totalDeposit":
            orderBy = direction(totalDeposit)
            break
        case "createdAt":
        default:
            orderBy = direction(users.createdAt)
            break
    }

    const [userData, totalCount] = await Promise.all([
        db.select({
            ...getTableColumns(users),
            successCount,
            failedCount,
            expiredCount,
            totalDeposit,
        })
            .from(users)
            .where(searchFilter)
            .limit(safeLimit)
            .offset(offset)
            .orderBy(orderBy),
        db.select({ count: count() })
            .from(users)
            .where(searchFilter)
    ])

    return {
        data: userData,
        currentUserRole: session.role,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total: totalCount[0].count,
            totalPages: Math.ceil(totalCount[0].count / safeLimit)
        }
    }
}

// Role hierarchy: higher number = more privileged
const ROLE_HIERARCHY: Record<string, number> = {
    user: 0,
    reseller: 1,
    admin: 2,
    developer: 3,
}

export async function updateUser(userId: number, data: {
    username: string
    email: string
    role: "admin" | "developer" | "user" | "reseller"
    balance: number
    discordId: string
    whatsappNumber: string
}) {
    const session = await verifyAdmin()

    // Validate input with Zod
    const { adminUserUpdateSchema, validateInput } = await import("@/lib/validations")
    const validation = validateInput(adminUserUpdateSchema, data)
    if (!validation.success) {
        return { success: false, error: validation.error }
    }

    try {
        // Get target user for role hierarchy check
        const [targetUser] = await db.select({
            role: users.role,
            username: users.username,
            email: users.email,
            balance: users.balance,
            discordId: users.discordId,
            whatsappNumber: users.whatsappNumber,
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (!targetUser) {
            return { success: false, error: "User tidak ditemukan" }
        }

        // Role hierarchy check: prevent editing users with higher/equal role (except self)
        const sessionLevel = ROLE_HIERARCHY[session.role] || 0
        const targetLevel = ROLE_HIERARCHY[targetUser.role] || 0
        const newRoleLevel = ROLE_HIERARCHY[data.role] || 0

        // Only developers can edit developers or admins
        if (session.role !== "developer" && targetLevel >= ROLE_HIERARCHY.admin) {
            return { success: false, error: "Anda tidak memiliki akses untuk mengedit user ini" }
        }

        // Prevent role escalation beyond own level
        if (newRoleLevel > sessionLevel) {
            return { success: false, error: "Tidak dapat meningkatkan role melebihi level Anda" }
        }

        await db.update(users)
            .set({
                username: data.username,
                email: data.email,
                role: data.role,
                balance: data.balance.toString(),
                discordId: data.discordId || null,
                whatsappNumber: data.whatsappNumber || null,
            })
            .where(eq(users.id, userId))

        // Audit log
        const { logAudit, createChangeDiff } = await import("@/lib/audit")
        const changes = createChangeDiff(
            { ...targetUser, balance: targetUser.balance },
            { ...data, balance: data.balance.toString() }
        )
        await logAudit({
            action: "update_user",
            targetType: "user",
            targetId: userId,
            performedBy: session.id,
            changes,
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user:", error)
        return { success: false, error: "Failed to update user" }
    }
}

export async function deleteUser(userId: number, confirmUsername: string) {
    const session = await verifyAdmin()

    try {
        // Only developers can delete users
        if (session.role !== "developer") {
            return { success: false, error: "Hanya developer yang dapat menghapus user" }
        }

        // Get target user
        const [targetUser] = await db.select({
            id: users.id,
            username: users.username,
            role: users.role,
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (!targetUser) {
            return { success: false, error: "User tidak ditemukan" }
        }

        // Prevent deleting developers
        if (targetUser.role === "developer") {
            return { success: false, error: "Tidak dapat menghapus developer" }
        }

        // Confirm username matches
        if (targetUser.username !== confirmUsername) {
            return { success: false, error: "Username konfirmasi tidak cocok" }
        }

        // Check for active transactions
        const activeTransactionsCount = await db.select({ count: count() })
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                eq(transactions.status, "pending")
            ))

        if (activeTransactionsCount[0].count > 0) {
            return {
                success: false,
                error: `User masih memiliki ${activeTransactionsCount[0].count} transaksi pending`
            }
        }

        // Soft delete: Anonymize user data
        await db.update(users)
            .set({
                email: `deleted_${userId}@anonymous.local`,
                username: `deleted_user_${userId}`,
                password: null,
                discordId: null,
                whatsappNumber: null,
                balance: "0",
            })
            .where(eq(users.id, userId))

        // Audit log
        const { logAudit } = await import("@/lib/audit")
        await logAudit({
            action: "delete_user",
            targetType: "user",
            targetId: userId,
            performedBy: session.id,
            changes: {
                originalUsername: targetUser.username,
                originalRole: targetUser.role,
            },
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete user:", error)
        return { success: false, error: "Gagal menghapus user" }
    }
}
export async function getAdminUserHistory(
    userId: number,
    tab: "transactions" | "deposits",
    query: string = "",
    page: number = 1,
    limit: number = 5
) {
    await verifyAdmin()
    const offset = (page - 1) * limit

    if (tab === "transactions") {
        const searchFilter = query
            ? or(like(transactions.orderId, `%${query}%`), like(products.name, `%${query}%`))
            : undefined

        const conditions = and(
            eq(transactions.userId, userId),
            searchFilter
        )

        const [data, total] = await Promise.all([
            db.select({
                id: transactions.id,
                orderId: transactions.orderId,
                productName: products.name,
                price: transactions.price,
                status: transactions.status,
                createdAt: transactions.createdAt,
            })
                .from(transactions)
                .leftJoin(products, eq(transactions.productId, products.id))
                .where(conditions)
                .limit(limit)
                .offset(offset)
                .orderBy(desc(transactions.createdAt)),
            db.select({ count: count() })
                .from(transactions)
                .leftJoin(products, eq(transactions.productId, products.id))
                .where(conditions)
        ])

        return {
            data,
            pagination: {
                page,
                limit,
                total: total[0].count,
                totalPages: Math.ceil(total[0].count / limit)
            }
        }
    } else {
        const searchFilter = query
            ? or(like(deposits.trxId, `%${query}%`), like(deposits.paymentChannel, `%${query}%`))
            : undefined

        const conditions = and(
            eq(deposits.userId, userId),
            searchFilter
        )

        const [data, total] = await Promise.all([
            db.select({
                id: deposits.id,
                trxId: deposits.trxId,
                amount: deposits.amount,
                paymentChannel: deposits.paymentChannel,
                status: deposits.status,
                createdAt: deposits.createdAt,
            })
                .from(deposits)
                .where(conditions)
                .limit(limit)
                .offset(offset)
                .orderBy(desc(deposits.createdAt)),
            db.select({ count: count() })
                .from(deposits)
                .where(conditions)
        ])

        return {
            data,
            pagination: {
                page,
                limit,
                total: total[0].count,
                totalPages: Math.ceil(total[0].count / limit)
            }
        }
    }
}

export async function getAdminTransactions(
    query: string = "",
    page: number = 1,
    limit: number = 10
) {
    await verifyAdmin()
    const offset = (page - 1) * limit

    let searchConditions: SQL[] = []

    if (query) {
        searchConditions = [
            like(transactions.orderId, `%${query}%`),
            like(transactions.snapToken, `%${query}%`),
            like(products.name, `%${query}%`),
            like(users.username, `%${query}%`),
            like(users.email, `%${query}%`)
        ]

        // Find matching stocks
        const matchingStocks = await db
            .select({ id: stocks.id })
            .from(stocks)
            .where(like(stocks.code, `%${query}%`))
            .limit(20)

        const stockIds = matchingStocks.map(s => s.id)

        if (stockIds.length > 0) {
            // Search in stockId column
            searchConditions.push(inArray(transactions.stockId, stockIds))

            // Search in assignedStocks column for each ID
            // We use LIKE because assignedStocks can be TEXT "123" or JSON "[123, 124]"
            stockIds.forEach(id => {
                searchConditions.push(like(transactions.assignedStocks, `%${id}%`))
            })
        }
    }

    const searchFilter = query && searchConditions.length > 0 ? or(...searchConditions) : undefined

    // Join with users and products
    const [transactionsData, total] = await Promise.all([
        db.select({
            id: transactions.id,
            orderId: transactions.orderId,
            productName: products.name,
            price: transactions.price,
            totalAmount: transactions.totalAmount,
            paymentMethod: transactions.paymentMethod,
            quantity: transactions.quantity,
            assignedStocks: transactions.assignedStocks,
            stockId: transactions.stockId,
            status: transactions.status,
            createdAt: transactions.createdAt,
            username: users.username,
            email: users.email
        })
            .from(transactions)
            .leftJoin(products, eq(transactions.productId, products.id))
            .leftJoin(users, eq(transactions.userId, users.id))
            .where(searchFilter)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(transactions.createdAt)),
        db.select({ count: count() })
            .from(transactions)
            .leftJoin(products, eq(transactions.productId, products.id))
            .leftJoin(users, eq(transactions.userId, users.id))
            .where(searchFilter)
    ])

    // Collect all stock IDs
    const stockIdsToFetch = new Set<number>()

    transactionsData.forEach(t => {
        // Check assignedStocks (JSON array of IDs)
        if (t.assignedStocks) {
            try {
                // Try to parse if it looks like an array
                const parsed = JSON.parse(t.assignedStocks)
                if (Array.isArray(parsed)) {
                    parsed.forEach((id: unknown) => {
                        const numId = Number(id)
                        // Ensure it is a valid 32-bit integer before adding
                        if (!isNaN(numId) && Number.isInteger(numId) && numId < 2147483647) {
                            stockIdsToFetch.add(numId)
                        }
                    })
                } else {
                    // Try single number
                    const numId = Number(parsed)
                    if (!isNaN(numId) && Number.isInteger(numId) && numId < 2147483647) {
                        stockIdsToFetch.add(numId)
                    }
                }
            } catch {
                // Not JSON, ignore
            }
        }
        // Check single stockId column
        if (t.stockId && Number.isInteger(t.stockId) && t.stockId < 2147483647) {
            stockIdsToFetch.add(t.stockId)
        }
    })

    // Fetch stocks if any IDs found
    const stockMap = new Map<number, string>()
    if (stockIdsToFetch.size > 0) {
        // inArray requires at least one element
        // Split into chunks if too many, but usually page limit=10 so small set
        const ids = Array.from(stockIdsToFetch)

        // Drizzle inArray helper needs to be imported, assume it is available or add it
        // If not imported, we need to add import 'inArray' from drizzle-orm
        // For safe execution, I will first modify imports if needed, but let's try to fetch
        const foundStocks = await db.select({
            id: stocks.id,
            code: stocks.code
        })
            .from(stocks)
            // using sql or inArray
            // To be safe without 'inArray' import, I will use sql
            .where(inArray(stocks.id, ids))

        foundStocks.forEach(s => {
            stockMap.set(s.id, s.code)
        })
    }

    // Map codes back to data
    const enhancedData = transactionsData.map(t => {
        const displayCodes: string[] = []

        // From assignedStocks
        if (t.assignedStocks) {
            try {
                const parsed = JSON.parse(t.assignedStocks)
                if (Array.isArray(parsed)) {
                    // Map IDs to codes or use raw value if not found/not an ID
                    const codes = parsed.map((id: unknown) => {
                        const numId = Number(id)
                        const resolved = stockMap.get(numId)
                        // Use resolved code, or if not found (deleted/raw string), use the raw value
                        return resolved || String(id)
                    }).filter(Boolean) as string[]

                    if (codes.length > 0) displayCodes.push(...codes)
                } else {
                    const numId = Number(parsed)
                    const resolved = stockMap.get(numId)
                    if (resolved) {
                        displayCodes.push(resolved)
                    } else {
                        // Fallback to raw value
                        displayCodes.push(String(parsed))
                    }
                }
            } catch {
                // If not JSON, assume it's legacy raw code text
                displayCodes.push(t.assignedStocks)
            }
        }

        // From single stockId
        if (t.stockId) {
            const code = stockMap.get(t.stockId)
            if (code && !displayCodes.includes(code)) displayCodes.push(code)
        }

        return {
            ...t,
            stockCodes: displayCodes
        }
    })

    return {
        data: enhancedData,
        pagination: {
            page,
            limit,
            total: total[0].count,
            totalPages: Math.ceil(total[0].count / limit)
        }
    }
}

export async function getAdminDeposits(
    query: string = "",
    page: number = 1,
    limit: number = 10
) {
    await verifyAdmin()
    const offset = (page - 1) * limit

    const searchFilter = query
        ? or(
            like(deposits.trxId, `%${query}%`),
            like(deposits.refId, `%${query}%`),
            like(deposits.paymentChannel, `%${query}%`),
            like(users.username, `%${query}%`),
            like(users.email, `%${query}%`)
        )
        : undefined

    const [data, total] = await Promise.all([
        db.select({
            id: deposits.id,
            trxId: deposits.trxId,
            refId: deposits.refId,
            amount: deposits.amount,
            paymentChannel: deposits.paymentChannel,
            status: deposits.status,
            createdAt: deposits.createdAt,
            username: users.username,
            email: users.email
        })
            .from(deposits)
            .leftJoin(users, eq(deposits.userId, users.id))
            .where(searchFilter)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(deposits.createdAt)),
        db.select({ count: count() })
            .from(deposits)
            .leftJoin(users, eq(deposits.userId, users.id))
            .where(searchFilter)
    ])

    return {
        data,
        pagination: {
            page,
            limit,
            total: total[0].count,
            totalPages: Math.ceil(total[0].count / limit)
        }
    }
}
