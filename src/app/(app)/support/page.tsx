import { Suspense } from "react"
import { getUserTickets } from "@/lib/actions/ticket"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare } from "lucide-react"
import Link from "next/link"
import { CreateTicketDialog } from "./create-ticket-dialog"

export const metadata = {
    title: "Bantuan & Support",
    description: "Pusat bantuan Redfinger",
}

async function TicketList() {
    const result = await getUserTickets()

    if (!result.success || !result.data) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Gagal memuat tiket.</p>
            </div>
        )
    }

    const tickets = result.data

    if (tickets.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">Belum ada tiket</h3>
                <p className="text-muted-foreground mb-4">Butuh bantuan? Buat tiket baru sekarang.</p>
                <CreateTicketDialog />
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {tickets.map((ticket) => {
                const isAnswered = ticket.status === 'answered';
                return (
                    <Link key={ticket.id} href={`/support/${ticket.id}`} className="block group">
                        <Card className="hover:bg-muted/50 transition-colors border shadow-sm">
                            <CardHeader className="p-4 md:p-6">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base font-semibold">
                                                {ticket.subject}
                                            </CardTitle>
                                            {isAnswered && (
                                                <Badge variant="secondary" className="bg-sky-500/10 text-sky-500 text-[10px] h-5 px-1.5 border-sky-500/20">
                                                    New Reply
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                                            <span>#{ticket.id}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                {(ticket as any).messageCount}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {new Date(ticket.lastActivityAt).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={
                                            ticket.status === 'open' ? 'secondary' :
                                                ticket.status === 'answered' ? 'default' : 'outline'
                                        }>
                                            {ticket.status === 'open' ? 'Menunggu' :
                                                ticket.status === 'answered' ? 'Dibalas' : 'Selesai'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px]">
                                            {ticket.priority.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                )
            })}
        </div>
    )
}

import { TicketListRefresher } from "@/components/TicketListRefresher"

export default function SupportPage() {
    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
            <TicketListRefresher />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pusat Bantuan</h1>
                    <p className="text-sm text-muted-foreground">
                        Daftar tiket bantuan Anda.
                    </p>
                </div>
                <CreateTicketDialog />
            </div>

            <Suspense fallback={
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="h-24 animate-pulse bg-muted/50" />
                    ))}
                </div>
            }>
                <TicketList />
            </Suspense>
        </div>
    )
}
