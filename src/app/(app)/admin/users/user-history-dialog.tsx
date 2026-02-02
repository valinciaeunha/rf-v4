"use client"

import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { getAdminUserHistory } from "@/lib/actions/admin"
import { cn } from "@/lib/utils"

interface UserHistoryDialogProps {
    userId: number
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UserHistoryDialog({ userId, open, onOpenChange }: UserHistoryDialogProps) {
    const [activeTab, setActiveTab] = useState<"transactions" | "deposits">("transactions")
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [page, setPage] = useState(1)
    const [data, setData] = useState<any[]>([])
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0, limit: 5 })
    const [loading, setLoading] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
            setPage(1) // Reset page on query change
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    // Fetch data
    useEffect(() => {
        if (!open) return

        let isMounted = true
        setLoading(true)

        getAdminUserHistory(userId, activeTab, debouncedQuery, page, 5)
            .then((res) => {
                if (isMounted) {
                    setData(res.data)
                    setPagination(res.pagination)
                }
            })
            .catch((err) => console.error("Failed to fetch history:", err))
            .finally(() => {
                if (isMounted) setLoading(false)
            })

        return () => { isMounted = false }
    }, [userId, activeTab, debouncedQuery, page, open])

    // Reset pagination when tab changes
    const handleTabChange = (tab: "transactions" | "deposits") => {
        setActiveTab(tab)
        setPage(1)
        setQuery("")
        setDebouncedQuery("")
    }

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount))
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(date))
    }

    // Pagination Logic similar to Shadcn component but using buttons
    const renderPaginationItems = () => {
        const items = []
        const totalPages = pagination.totalPages
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <Button
                        key={i}
                        variant={page === i ? "outline" : "ghost"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setPage(i)}
                        disabled={loading}
                    >
                        {i}
                    </Button>
                )
            }
        } else {
            items.push(
                <Button key={1} variant={page === 1 ? "outline" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setPage(1)} disabled={loading}>1</Button>
            )
            if (page > 3) {
                items.push(<div key="start-ellipsis" className="flex h-9 w-9 items-center justify-center"><MoreHorizontal className="h-4 w-4" /></div>)
            }
            let start = Math.max(2, page - 1);
            let end = Math.min(totalPages - 1, page + 1);
            if (start <= 1) start = 2;
            if (end >= totalPages) end = totalPages - 1;
            for (let i = start; i <= end; i++) {
                items.push(
                    <Button key={i} variant={page === i ? "outline" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setPage(i)} disabled={loading}>{i}</Button>
                )
            }

            if (page < totalPages - 2) {
                items.push(<div key="end-ellipsis" className="flex h-9 w-9 items-center justify-center"><MoreHorizontal className="h-4 w-4" /></div>)
            }
            if (totalPages > 1) {
                items.push(
                    <Button key={totalPages} variant={page === totalPages ? "outline" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setPage(totalPages)} disabled={loading}>{totalPages}</Button>
                )
            }
        }
        return items
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>User History</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Tabs Control */}
                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleTabChange("transactions")}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 sm:flex-none",
                                activeTab === "transactions"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            Transactions
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange("deposits")}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 sm:flex-none",
                                activeTab === "deposits"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            Deposits
                        </button>
                    </div>

                    {/* Search */}
                    <InputGroup className="w-full">
                        <InputGroupAddon>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder={`Search ${activeTab}...`}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </InputGroup>

                    {/* Data Table */}
                    <div className="rounded-md border min-h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {activeTab === "transactions" ? (
                                        <>
                                            <TableHead>Order ID / Product</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Date</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead>Trx ID / Channel</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Date</TableHead>
                                        </>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-[120px]" />
                                                    <Skeleton className="h-3 w-[80px]" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[80px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-[60px] rounded-full" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-3 w-[100px] ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No {activeTab} found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item) => (
                                        <TableRow key={item.id}>
                                            {activeTab === "transactions" ? (
                                                <>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-xs truncate max-w-[150px]" title={item.orderId}>
                                                                {item.orderId}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.productName}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {formatCurrency(item.price)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.status === 'success' ? 'default' : item.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {formatDate(item.createdAt)}
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-xs truncate max-w-[150px]" title={item.trxId}>
                                                                {item.trxId}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.paymentChannel}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {formatCurrency(item.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.status === 'success' ? 'default' : item.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {formatDate(item.createdAt)}
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2">
                            <Button
                                variant="ghost"
                                className="gap-1 px-2.5 sm:pl-2.5"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:block">Previous</span>
                            </Button>

                            <div className="flex items-center gap-1">
                                {renderPaginationItems()}
                            </div>

                            <Button
                                variant="ghost"
                                className="gap-1 px-2.5 sm:pr-2.5"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page >= pagination.totalPages || loading}
                            >
                                <span className="hidden sm:block">Next</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
