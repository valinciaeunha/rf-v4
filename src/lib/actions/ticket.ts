"use server"

import { db } from "@/lib/db"
import { tickets, ticketMessages, users, transactions, deposits } from "@/lib/db/schema"
import { eq, desc, asc, and, sql, or, ne } from "drizzle-orm"
import { getSessionUser } from "./auth"
import { revalidatePath } from "next/cache"

export interface CreateTicketParams {
    subject: string
    priority: "low" | "medium" | "high"
    message: string
}

export interface ReplyTicketParams {
    ticketId: number
    message: string
}

// 1. Get User Tickets
export async function getUserTickets() {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    try {
        const userTickets = await db.query.tickets.findMany({
            where: eq(tickets.userId, session.id),
            orderBy: [desc(tickets.lastActivityAt)],
            with: {
                user: {
                    columns: {
                        username: true
                    }
                },
                messages: {
                    columns: { id: true }
                }
            }
        })

        const mapped = userTickets.map(t => ({
            ...t,
            messageCount: t.messages.length
        }))

        return { success: true, data: mapped }
    } catch (error) {
        console.error("Error fetching user tickets:", error)
        return { success: false, error: "Failed to fetch tickets" }
    }
}

// 2. Get Ticket Details (Messages)
export async function getTicketDetails(ticketId: number) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    try {
        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketId),
            with: {
                user: {
                    columns: {
                        username: true,
                        email: true,
                        role: true
                    }
                }
            }
        })

        if (!ticket) return { success: false, error: "Ticket not found" }

        // Security check: Only owner or admin can view
        const isAdmin = session.role === "admin" || session.role === "owner" || session.role === "developer"
        if (ticket.userId !== session.id && !isAdmin) {
            return { success: false, error: "Forbidden" }
        }

        const messages = await db.query.ticketMessages.findMany({
            where: eq(ticketMessages.ticketId, ticketId),
            orderBy: [asc(ticketMessages.createdAt)],
            with: {
                user: {
                    columns: {
                        username: true,
                        role: true
                    }
                }
            }
        })

        return { success: true, data: { ticket, messages } }
    } catch (error) {
        console.error("Error fetching ticket details:", error)
        return { success: false, error: "Failed to fetch ticket details" }
    }
}

// 3. Create Ticket
export async function createTicket(params: CreateTicketParams) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const { subject, priority, message } = params

    if (!subject || !message) {
        return { success: false, error: "Subject and message are required" }
    }

    try {
        // Create Ticket
        const [newTicket] = await db.insert(tickets).values({
            userId: session.id,
            subject,
            priority,
            status: "open",
            lastActivityAt: new Date(),
        }).returning()

        // Create First Message
        await db.insert(ticketMessages).values({
            ticketId: newTicket.id,
            userId: session.id,
            message,
            isAdminReply: false
        })

        revalidatePath("/support")
        return { success: true, data: newTicket }
    } catch (error) {
        console.error("Error creating ticket:", error)
        return { success: false, error: "Failed to create ticket" }
    }
}

// 4. Reply Ticket
export async function replyTicket(params: ReplyTicketParams) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const { ticketId, message } = params

    if (!message) return { success: false, error: "Message is required" }

    try {
        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketId)
        })

        if (!ticket) return { success: false, error: "Ticket not found" }

        const isAdmin = session.role === "admin" || session.role === "owner" || session.role === "developer"

        // Update Ticket Status & Last Activity
        const newStatus = isAdmin ? "answered" : "open"
        await db.update(tickets).set({
            status: newStatus,
            lastActivityAt: new Date()
        }).where(and(eq(tickets.id, ticketId), ne(tickets.status, "closed")))

        // Create Message
        const [newMessage] = await db.insert(ticketMessages).values({
            ticketId,
            userId: session.id,
            message,
            isAdminReply: isAdmin
        }).returning()

        // Fetch full message details with user for broadcasting
        const messageWithUser = await db.query.ticketMessages.findFirst({
            where: eq(ticketMessages.id, newMessage.id),
            with: {
                user: {
                    columns: {
                        username: true,
                        role: true
                    }
                }
            }
        })

        // Publish to Redis
        if (messageWithUser) {
            const { redis } = await import("@/lib/db")
            // Broadcast message
            await redis.publish(`ticket:${ticketId}`, JSON.stringify(messageWithUser))

            // Broadcast status update
            await redis.publish(`ticket:${ticketId}`, JSON.stringify({
                type: "status_update",
                status: newStatus
            }))

            // Broadcast List Update (Make sure lists refresh)
            const listPayload = JSON.stringify({ ticketId, type: "list_update" })
            await redis.publish(`user:${ticket.userId}:tickets`, listPayload)
            await redis.publish(`admin:tickets`, listPayload)
        }

        revalidatePath(`/support/${ticketId}`)
        revalidatePath(`/admin/tickets/${ticketId}`)
        return { success: true }
    } catch (error) {
        console.error("Error replying to ticket:", error)
        return { success: false, error: "Failed to reply" }
    }
}

// 4.1 Save AI Reply (Called by frontend Cia)
export async function saveAiReply(params: { ticketId: number, message: string }) {
    try {
        const { ticketId, message } = params

        // 0. Get Ticket Owner
        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketId),
            columns: { userId: true }
        })

        if (!ticket) return { success: false }

        // Update Ticket Status (only if NOT closed)
        const updated = await db.update(tickets).set({
            status: "answered",
            lastActivityAt: new Date()
        }).where(and(eq(tickets.id, ticketId), ne(tickets.status, "closed"))).returning()

        // Create AI Message
        // Find a valid admin/system user to attribute this to
        const systemUser = await db.query.users.findFirst({
            where: or(eq(users.role, 'admin'), eq(users.role, 'owner'), eq(users.role, 'developer'))
        })

        const [newMessage] = await db.insert(ticketMessages).values({
            ticketId,
            userId: systemUser?.id || 1, // Fallback to 1 if check fails (error will show)
            message,
            isAdminReply: true,
            isAiReply: true
        }).returning()

        // Sync with Redis
        const messageWithUser = await db.query.ticketMessages.findFirst({
            where: eq(ticketMessages.id, newMessage.id),
            with: {
                user: {
                    columns: { username: true, role: true }
                }
            }
        })

        if (messageWithUser) {
            const { redis } = await import("@/lib/db")
            await redis.publish(`ticket:${ticketId}`, JSON.stringify(messageWithUser))

            // Broadcast status if changed
            if (updated.length > 0) {
                await redis.publish(`ticket:${ticketId}`, JSON.stringify({
                    type: "status_update",
                    status: "answered"
                }))
            }

            // Broadcast List Update
            const listPayload = JSON.stringify({ ticketId, type: "list_update" })
            await redis.publish(`user:${ticket.userId}:tickets`, listPayload)
            await redis.publish(`admin:tickets`, listPayload)
        }

        revalidatePath(`/support/${ticketId}`)
        revalidatePath(`/admin/tickets/${ticketId}`)
        return { success: true }
    } catch (error) {
        console.error("Error saving AI reply:", error)
        return { success: false }
    }
}

// 5. Admin: Get All Tickets
export async function getAllTickets() {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    if (session.role !== "admin" && session.role !== "owner" && session.role !== "developer") {
        return { success: false, error: "Forbidden" }
    }

    try {
        const allTickets = await db.query.tickets.findMany({
            orderBy: [desc(tickets.lastActivityAt)],
            with: {
                user: {
                    columns: {
                        username: true,
                        email: true
                    }
                },
                messages: {
                    columns: { id: true }
                }
            }
        })

        const mapped = allTickets.map(t => ({
            ...t,
            messageCount: t.messages.length
        }))

        return { success: true, data: mapped }

    } catch (error) {
        console.error("Error fetching admin tickets:", error)
        return { success: false, error: "Failed to fetch tickets" }
    }
}

// 6. Admin: Update Status
export async function updateTicketStatus(ticketId: number, status: "open" | "answered" | "closed") {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const isAdmin = session.role === "admin" || session.role === "owner" || session.role === "developer"
    if (!isAdmin) return { success: false, error: "Forbidden" }

    try {
        await db.update(tickets)
            .set({ status })
            .where(eq(tickets.id, ticketId))

        // Broadcast to Redis
        const { redis } = await import("@/lib/db")
        await redis.publish(`ticket:${ticketId}`, JSON.stringify({
            type: "status_update",
            status
        }))

        revalidatePath(`/admin/tickets/${ticketId}`) // Fix revalidate path
        revalidatePath(`/admin/tickets`)
        return { success: true }
    } catch (error) {
        console.error("Error updating ticket status:", error)
        return { success: false, error: "Failed to update status" }
    }
}

// 7. Admin: Get User Stats for Ticket View
export async function getUserTicketStats(userId: number) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const isAdmin = session.role === "admin" || session.role === "owner" || session.role === "developer"
    if (!isAdmin) return { success: false, error: "Forbidden" }

    try {
        // 1. User Balance
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { balance: true }
        })

        // 2. Success Transactions
        const successTrx = await db
            .select({
                count: sql<number>`count(*)`,
                amount: sql<string>`sum(${transactions.totalAmount})`
            })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.status, 'success')))

        // 3. Pending Transactions (Product)
        const pendingTrx = await db
            .select({
                count: sql<number>`count(*)`,
                amount: sql<string>`sum(${transactions.totalAmount})`
            })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.status, 'pending')))

        // 4. Pending Deposits
        const pendingDep = await db
            .select({
                count: sql<number>`count(*)`,
                amount: sql<string>`sum(${deposits.totalDiterima})`
            })
            .from(deposits)
            .where(and(eq(deposits.userId, userId), eq(deposits.status, 'pending')))

        return {
            success: true,
            data: {
                balance: Number(user?.balance || 0),
                successTrx: { count: Number(successTrx[0].count), amount: Number(successTrx[0].amount || 0) },
                pendingTrx: { count: Number(pendingTrx[0].count), amount: Number(pendingTrx[0].amount || 0) },
                pendingDep: { count: Number(pendingDep[0].count), amount: Number(pendingDep[0].amount || 0) }
            }
        }
    } catch (e) {
        console.error("Error fetching user stats:", e)
        return { success: false, error: "Failed to fetch stats" }
    }
}

// 8. Broadcast Typing Status
export async function broadcastTyping(ticketId: number, isAi = false) {
    const session = await getSessionUser()
    if (!session) return { success: false }

    try {
        const { redis } = await import("@/lib/db")
        await redis.publish(`ticket:${ticketId}`, JSON.stringify({
            type: "typing",
            userId: isAi ? 0 : session.id, // Use 0 or special ID for AI
            username: isAi ? "Cia" : session.username,
            role: isAi ? "ai" : session.role,
            isAi: isAi
        }))
        return { success: true }
    } catch (e) {
        return { success: false }
    }
}
// 9. Admin: Toggle AI
export async function toggleAiForTicket(ticketId: number, enabled: boolean) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const isAdmin = session.role === "admin" || session.role === "owner" || session.role === "developer"
    if (!isAdmin) return { success: false, error: "Forbidden" }

    try {
        await db.update(tickets)
            .set({ aiEnabled: enabled })
            .where(eq(tickets.id, ticketId))

        revalidatePath(`/admin/tickets/${ticketId}`)
        return { success: true }
    } catch (error) {
        console.error("Error toggling AI:", error)
        return { success: false, error: "Failed to toggle AI" }
    }
}

// 10. Admin: Delete Ticket
export async function deleteTicket(ticketId: number) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Unauthorized" }

    const isAdmin = session.role === "admin" || session.role === "owner" || session.role === "developer"
    if (!isAdmin) return { success: false, error: "Forbidden" }

    try {
        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketId),
            columns: { userId: true }
        })

        if (!ticket) return { success: false, error: "Ticket not found" }

        await db.delete(tickets).where(eq(tickets.id, ticketId))

        const { redis } = await import("@/lib/db")
        const listPayload = JSON.stringify({ ticketId, type: "list_update" })
        await redis.publish(`user:${ticket.userId}:tickets`, listPayload)
        await redis.publish(`admin:tickets`, listPayload)

        revalidatePath(`/admin/tickets`)
        return { success: true }
    } catch (e) {
        console.error("Error deleting ticket:", e)
        return { success: false, error: "Failed to delete" }
    }
}
