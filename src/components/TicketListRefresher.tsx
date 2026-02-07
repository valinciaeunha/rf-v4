"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function TicketListRefresher() {
    const router = useRouter()

    useEffect(() => {
        const eventSource = new EventSource("/api/tickets/updates")

        eventSource.onopen = () => {
            // console.log("Listening for ticket updates...")
        }

        eventSource.onmessage = (event) => {
            try {
                // Ignore ping
                if (event.data.trim() === ": ping") return

                const data = JSON.parse(event.data)

                if (data.type === "list_update") {
                    console.log("🔄 Ticket list updated from server")
                    router.refresh()
                }
            } catch (e) {
                // console.error("Error parsing update", e)
            }
        }

        eventSource.onerror = (err) => {
            eventSource.close()
            // Optional: Reconnect logic if needed, but browser usually handles it
        }

        return () => {
            eventSource.close()
        }
    }, [router])

    return null
}
