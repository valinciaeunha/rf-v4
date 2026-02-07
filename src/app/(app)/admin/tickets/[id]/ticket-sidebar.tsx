"use client"

import { User, Wallet, ShoppingCart, CreditCard, ExternalLink, Clock } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AdminTicketControls } from "./admin-ticket-controls"

interface TicketSidebarProps {
    ticket: any
    stats: any
}

export function TicketSidebar({ ticket, stats }: TicketSidebarProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount)
    }

    return (
        <div className="space-y-6">
            {/* User Profile Card */}
            <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg">{ticket.user.username}</h3>
                    <p className="text-sm text-muted-foreground">{ticket.user.email}</p>
                </div>
                <Badge variant="outline" className="capitalize">{ticket.user.role}</Badge>
            </div>

            <Separator />

            {/* Ticket Controls */}
            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ticket Actions</h4>
                <div className="flex justify-stretch">
                    <AdminTicketControls
                        ticketId={ticket.id}
                        status={ticket.status}
                        aiEnabled={ticket.aiEnabled}
                    />
                </div>
            </div>

            <Separator />

            {/* Stats */}
            {stats && (
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Overview</h4>

                    <div className="space-y-3">
                        <div className="bg-card p-3 rounded-lg border shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Wallet className="h-4 w-4" />
                                <span className="text-xs font-medium">Sisa Saldo</span>
                            </div>
                            <div className="text-lg font-bold text-primary">{formatCurrency(stats.balance)}</div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-card p-3 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ShoppingCart className="h-3 w-3" />
                                        <span className="text-[10px] font-medium uppercase">Sukses</span>
                                    </div>
                                    <span className="text-xs font-bold">{stats.successTrx.count}x</span>
                                </div>
                                <div className="text-sm font-semibold">{formatCurrency(stats.successTrx.amount)}</div>
                            </div>

                            <div className="bg-card p-3 rounded-lg border shadow-sm border-orange-200/50 bg-orange-50/5 dark:bg-orange-900/10">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-orange-500">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-[10px] font-medium uppercase">Pending Trx</span>
                                    </div>
                                    <span className="text-xs font-bold text-orange-500">{stats.pendingTrx.count}x</span>
                                </div>
                                <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(stats.pendingTrx.amount)}</div>
                            </div>

                            <div className="bg-card p-3 rounded-lg border shadow-sm border-blue-200/50 bg-blue-50/5 dark:bg-blue-900/10">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <CreditCard className="h-3 w-3" />
                                        <span className="text-[10px] font-medium uppercase">Pending Deposit</span>
                                    </div>
                                    <span className="text-xs font-bold text-blue-500">{stats.pendingDep.count}x</span>
                                </div>
                                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(stats.pendingDep.amount)}</div>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full text-xs" asChild>
                        <Link href={`/admin/transactions?userId=${ticket.userId}`} target="_blank">
                            View All Transactions
                            <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
