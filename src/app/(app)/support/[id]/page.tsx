import { Suspense } from "react"
import { getTicketDetails } from "@/lib/actions/ticket"
import { getSessionUser } from "@/lib/actions/auth"
import { TicketChat } from "@/components/TicketChat"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export const metadata = {
    title: "Detail Tiket",
}

export default async function TicketDetailPage({ params }: PageProps) {
    const { id } = await params
    const ticketId = parseInt(id)
    if (isNaN(ticketId)) notFound()

    const session = await getSessionUser()
    if (!session) return <div>Unauthorized</div>

    const result = await getTicketDetails(ticketId)

    if (!result.success || !result.data) {
        return (
            <div className="container py-10">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive">Error</h1>
                    <p className="text-muted-foreground">{result.error}</p>
                </div>
            </div>
        )
    }

    const { ticket, messages } = result.data

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 p-4 pb-0 md:p-6 md:pb-0 gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
                        <Link href="/support">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>
                <TicketChat
                    ticket={ticket}
                    messages={messages}
                    currentUserId={session.id}
                    currentUserName={session.username}
                />
            </div>
        </div>
    )
}
