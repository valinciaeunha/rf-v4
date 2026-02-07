import { Suspense } from "react"
import { getTicketDetails, getUserTicketStats } from "@/lib/actions/ticket"
import { getSessionUser } from "@/lib/actions/auth"
import { TicketChat } from "@/components/TicketChat"
import { AdminTicketControls } from "./admin-ticket-controls"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Wallet, ShoppingCart, CreditCard, ExternalLink, Clock, Info } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { TicketSidebar } from "./ticket-sidebar"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export const metadata = {
    title: "Detail Tiket (Admin)",
}

export default async function AdminTicketDetailPage({ params }: PageProps) {
    const { id } = await params
    const ticketId = parseInt(id)
    if (isNaN(ticketId)) notFound()

    const session = await getSessionUser()
    if (!session) return <div>Unauthorized</div>

    const ticketResult = await getTicketDetails(ticketId)

    if (!ticketResult.success || !ticketResult.data) {
        return <div>Error loading ticket</div>
    }

    const { ticket, messages } = ticketResult.data

    // Fetch User Stats
    const statsResult = await getUserTicketStats(ticket.userId)
    const stats = statsResult.data

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 p-4 md:p-6 gap-4 h-full">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
                            <Link href="/admin/tickets">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold flex items-center gap-2">
                                Ticket #{ticket.id}
                                <Badge variant={ticket.status === 'open' ? 'secondary' : ticket.status === 'answered' ? 'default' : 'outline'}>
                                    {ticket.status}
                                </Badge>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Removed duplicate AdminTicketControls */}
                    </div>

                    {/* Mobile Info Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="lg:hidden h-8 w-8 bg-muted/50 border-0">
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] px-6">
                            {/* Changed side to bottom for better mobile UX, rounded top */}
                            <SheetHeader className="pb-4 border-b mb-4">
                                <SheetTitle className="text-center">Informasi Tiket & User</SheetTitle>
                            </SheetHeader>
                            <div className="h-full overflow-y-auto pb-20 scrollbar-hide">
                                <TicketSidebar ticket={ticket} stats={stats} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                    <TicketChat
                        ticket={ticket}
                        messages={messages}
                        currentUserId={session.id}
                        currentUserName={session.username}
                        viewMode="admin"
                    />
                </div>
            </div>

            {/* Right Sidebar - Desktop Only */}
            <div className="hidden lg:block w-80 border-l bg-muted/10 shrink-0 h-full overflow-y-auto">
                <div className="p-6">
                    <TicketSidebar ticket={ticket} stats={stats} />
                </div>
            </div>
        </div>
    )
}
