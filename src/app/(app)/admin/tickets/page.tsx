import { Suspense } from "react"
import { getAllTickets } from "@/lib/actions/ticket"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, Clock, MessageSquare } from "lucide-react"
import { DeleteTicketButton } from "./delete-ticket-button"

export const metadata = {
    title: "Daftar Tiket (Admin)",
}

async function AdminTicketList() {
    const result = await getAllTickets()

    if (!result.success || !result.data) {
        return <div className="text-center py-10">Gagal memuat data tiket.</div>
    }

    const tickets = result.data

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Tiket Support</CardTitle>
                <CardDescription>
                    Kelola tiket masuk dari user.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Subject/Status</TableHead>
                                <TableHead className="hidden md:table-cell">Status</TableHead>
                                <TableHead className="hidden md:table-cell">Priority</TableHead>
                                <TableHead className="hidden md:table-cell">Messages</TableHead>
                                <TableHead className="hidden md:table-cell">Last Update</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        Tidak ada tiket.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell>
                                            <div className="font-medium">{ticket.user.username}</div>
                                            <div className="text-xs text-muted-foreground hidden md:block">{ticket.user.email}</div>
                                        </TableCell>
                                        <TableCell className="max-w-[150px] md:max-w-[200px] truncate">
                                            <div title={ticket.subject}>{ticket.subject}</div>
                                            <div className="md:hidden mt-1">
                                                <Badge variant={
                                                    ticket.status === 'open' ? 'default' :
                                                        ticket.status === 'answered' ? 'secondary' : 'outline'
                                                } className="text-[10px] h-5 px-1.5">
                                                    {ticket.status}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant={
                                                ticket.status === 'open' ? 'default' :
                                                    ticket.status === 'answered' ? 'secondary' : 'outline'
                                            }>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>
                                                {ticket.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                <MessageSquare className="h-3 w-3" />
                                                {(ticket as any).messageCount}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {new Date(ticket.lastActivityAt).toLocaleString('id-ID')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button asChild size="sm" variant="ghost">
                                                    <Link href={`/admin/tickets/${ticket.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <DeleteTicketButton ticketId={ticket.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

import { TicketListRefresher } from "@/components/TicketListRefresher"

export default function AdminTicketsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <TicketListRefresher />
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Support Tickets</h2>
            </div>

            <Suspense fallback={<div>Loading tickets...</div>}>
                <AdminTicketList />
            </Suspense>
        </div>
    )
}
