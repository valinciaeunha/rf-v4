import { Metadata } from "next"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput
} from "@/components/ui/input-group"
import { getAdminTransactions, getAdminDeposits, verifyAdmin } from "@/lib/actions/admin"
import { cn } from "@/lib/utils"
import { TransactionSearch } from "./search"
import { StockDialog } from "./stock-dialog"

export const metadata: Metadata = {
    title: "Admin Transactions",
    description: "Manage system transactions and deposits",
}

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await verifyAdmin()
    const resolvedParams = await searchParams

    const tab = (resolvedParams.tab as string) || "transactions"
    const query = (resolvedParams.q as string) || ""
    const page = Number(resolvedParams.page) || 1

    // Fetch data based on tab
    let data: any[] = []
    let pagination = { totalPages: 1, page: 1, limit: 10, total: 0 }

    if (tab === "transactions") {
        const res = await getAdminTransactions(query, page)
        data = res.data
        pagination = res.pagination
    } else {
        const res = await getAdminDeposits(query, page)
        data = res.data
        pagination = res.pagination
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

    // Pagination Logic
    const renderPaginationItems = () => {
        const items = []
        const totalPages = pagination.totalPages
        const maxVisible = 5

        const getPageHref = (pageNum: number) => {
            return `?tab=${tab}&q=${query}&page=${pageNum}`
        }

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink href={getPageHref(i)} isActive={page === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
        } else {
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink href={getPageHref(1)} isActive={page === 1}> 1 </PaginationLink>
                </PaginationItem>
            )
            if (page > 3) {
                items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>)
            }
            let start = Math.max(2, page - 1);
            let end = Math.min(totalPages - 1, page + 1);
            if (start <= 1) start = 2;
            if (end >= totalPages) end = totalPages - 1;
            for (let i = start; i <= end; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink href={getPageHref(i)} isActive={page === i}> {i} </PaginationLink>
                    </PaginationItem>
                )
            }
            if (page < totalPages - 2) {
                items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>)
            }
            if (totalPages > 1) {
                items.push(
                    <PaginationItem key={totalPages}>
                        <PaginationLink href={getPageHref(totalPages)} isActive={page === totalPages}> {totalPages} </PaginationLink>
                    </PaginationItem>
                )
            }
        }
        return items
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Transactions & Deposits</h2>
                    <p className="text-muted-foreground">
                        Manage system transactions and deposits here.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit">
                <Link
                    href={`?tab=transactions&page=1`}
                    className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                        tab === "transactions"
                            ? "bg-background text-foreground shadow-sm"
                            : "hover:bg-background/50 hover:text-foreground"
                    )}
                >
                    Transactions
                </Link>
                <Link
                    href={`?tab=deposits&page=1`}
                    className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                        tab === "deposits"
                            ? "bg-background text-foreground shadow-sm"
                            : "hover:bg-background/50 hover:text-foreground"
                    )}
                >
                    Deposits
                </Link>
            </div>

            <Card className="w-full overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>{tab === 'transactions' ? 'All Transactions' : 'All Deposits'}</CardTitle>
                        <CardDescription>
                            {pagination.total} records found.
                        </CardDescription>
                    </div>
                    <TransactionSearch placeholder={`Search ${tab}...`} />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>User</TableHead>
                                    {tab === "transactions" ? (
                                        <>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="max-w-[150px]">Stock</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead>Channel</TableHead>
                                            <TableHead>Amount</TableHead>
                                        </>
                                    )}
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {tab === 'transactions' ? item.orderId : item.trxId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs">{item.username}</span>
                                                    <span className="text-xs text-muted-foreground">{item.email}</span>
                                                </div>
                                            </TableCell>
                                            {tab === "transactions" ? (
                                                <>
                                                    <TableCell>{item.productName}</TableCell>
                                                    <TableCell className="text-xs">{item.paymentMethod || '-'}</TableCell>
                                                    <TableCell className="font-mono text-xs text-right whitespace-nowrap">{formatCurrency(item.price)}</TableCell>
                                                    <TableCell className="text-xs text-right">{item.quantity}x</TableCell>
                                                    <TableCell className="text-xs">
                                                        <StockDialog
                                                            stocks={item.stockCodes || []}
                                                            orderId={item.orderId}
                                                            status={item.status}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-right whitespace-nowrap">{formatCurrency(item.totalAmount)}</TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>{item.paymentChannel || '-'}</TableCell>
                                                    <TableCell className="font-mono text-xs">{formatCurrency(item.amount)}</TableCell>
                                                </>
                                            )}
                                            <TableCell>
                                                <Badge variant={item.status === 'success' ? 'default' : item.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDate(item.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href={`?tab=${tab}&q=${query}&page=${Math.max(1, page - 1)}`}
                                            aria-disabled={page <= 1}
                                            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>

                                    {renderPaginationItems()}

                                    <PaginationItem>
                                        <PaginationNext
                                            href={`?tab=${tab}&q=${query}&page=${Math.min(pagination.totalPages, page + 1)}`}
                                            aria-disabled={page >= pagination.totalPages}
                                            className={page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

