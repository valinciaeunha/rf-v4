"use client"

// Simple client-side cache for ticket messages to eliminate loading flicker
const ticketCache = new Map<number, any[]>()
const viewedTickets = new Set<number>()

export function getCachedMessages(ticketId: number) {
    if (typeof window === "undefined") return null
    return ticketCache.get(ticketId) || null
}

export function setCachedMessages(ticketId: number, messages: any[]) {
    if (typeof window === "undefined") return
    ticketCache.set(ticketId, messages)
}

export function isTicketViewed(ticketId: number) {
    return viewedTickets.has(ticketId)
}

export function markTicketViewed(ticketId: number) {
    viewedTickets.add(ticketId)
}
