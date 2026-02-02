import { getAdminUsers } from "@/lib/actions/admin"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserSearch } from "./search"
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
import Link from "next/link"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { UserRowActions } from "./user-row-actions"

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string
        page?: string
        sort?: string
        order?: "asc" | "desc"
    }>
}) {
    const params = await searchParams
    const query = params.q || ""
    const page = Number(params.page) || 1
    const sort = params.sort || "createdAt"
    const order = params.order || "desc"

    // Limit set to 20
    const { data: users, pagination, currentUserRole } = await getAdminUsers(query, page, 20, sort, order)

    const isDeveloper = currentUserRole === "developer"

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
            timeZone: "Asia/Jakarta",
        }).format(new Date(date))
    }

    const totalPages = pagination.totalPages

    // Sort Helper
    const getSortLink = (column: string) => {
        const isCurrent = sort === column
        const newOrder = isCurrent && order === "asc" ? "desc" : "asc"
        const p = new URLSearchParams()
        if (query) p.set("q", query)
        p.set("page", "1")
        p.set("sort", column)
        p.set("order", newOrder)
        return `?${p.toString()}`
    }



    const getSortIcon = (column: string) => {
        if (sort !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50 inline-block" />
        return order === "asc"
            ? <ArrowUp className="ml-2 h-4 w-4 inline-block" />
            : <ArrowDown className="ml-2 h-4 w-4 inline-block" />
    }

    // Numbered Pagination Logic
    const renderPaginationItems = () => {
        const items = []
        const maxVisible = 5
        const pValues = new URLSearchParams()
        if (query) pValues.set("q", query)
        pValues.set("sort", sort)
        pValues.set("order", order)

        const getPageHref = (pageNum: number) => {
            const p = new URLSearchParams(pValues.toString())
            p.set("page", pageNum.toString())
            return `?${p.toString()}`
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

    // Previous/Next Hrefs
    const getBasePaginationParams = () => {
        const p = new URLSearchParams()
        if (query) p.set("q", query)
        p.set("sort", sort)
        p.set("order", order)
        return p
    }

    const prevHref = (() => {
        const p = getBasePaginationParams()
        p.set("page", Math.max(1, page - 1).toString())
        return `?${p.toString()}`
    })()

    const nextHref = (() => {
        const p = getBasePaginationParams()
        p.set("page", Math.min(totalPages, page + 1).toString())
        return `?${p.toString()}`
    })()


    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">
                        Manage your application users here.
                    </p>
                </div>
            </div>

            <Card className="w-full overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>User List</CardTitle>
                    <UserSearch />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[150px]">
                                        <Link href={getSortLink("username")} className="flex items-center hover:text-foreground transition-colors group">
                                            Username {getSortIcon("username")}
                                        </Link>
                                    </TableHead>
                                    <TableHead className="min-w-[200px]">
                                        <Link href={getSortLink("email")} className="flex items-center hover:text-foreground transition-colors group">
                                            Email {getSortIcon("email")}
                                        </Link>
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        <Link href={getSortLink("role")} className="flex items-center hover:text-foreground transition-colors group">
                                            Role {getSortIcon("role")}
                                        </Link>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Link href={getSortLink("balance")} className="flex items-center justify-end hover:text-foreground transition-colors group">
                                            Balance {getSortIcon("balance")}
                                        </Link>
                                    </TableHead>

                                    {/* Stats Columns */}
                                    <TableHead className="text-right whitespace-nowrap">
                                        <Link href={getSortLink("successCount")} className="flex items-center justify-end hover:text-foreground transition-colors group">
                                            Success {getSortIcon("successCount")}
                                        </Link>
                                    </TableHead>
                                    <TableHead className="text-right whitespace-nowrap">
                                        <Link href={getSortLink("failedCount")} className="flex items-center justify-end hover:text-foreground transition-colors group">
                                            Failed {getSortIcon("failedCount")}
                                        </Link>
                                    </TableHead>
                                    <TableHead className="text-right whitespace-nowrap">
                                        <Link href={getSortLink("expiredCount")} className="flex items-center justify-end hover:text-foreground transition-colors group">
                                            Expired {getSortIcon("expiredCount")}
                                        </Link>
                                    </TableHead>
                                    <TableHead className="text-right whitespace-nowrap">
                                        <Link href={getSortLink("totalDeposit")} className="flex items-center justify-end hover:text-foreground transition-colors group">
                                            Total Deposit {getSortIcon("totalDeposit")}
                                        </Link>
                                    </TableHead>

                                    <TableHead className="min-w-[150px]">
                                        <Link href={getSortLink("createdAt")} className="flex items-center hover:text-foreground transition-colors group">
                                            Joined {getSortIcon("createdAt")}
                                        </Link>
                                    </TableHead>
                                    {isDeveloper && <TableHead className="w-[50px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isDeveloper ? 10 : 9} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{user.username}</span>
                                                    {user.discordId && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Disc: {user.discordId}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-xs" title={user.email}>
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.role === "admin"
                                                            ? "destructive"
                                                            : user.role === "developer"
                                                                ? "default"
                                                                : "secondary"
                                                    }
                                                    className="uppercase text-[10px]"
                                                >
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {formatCurrency(user.balance)}
                                            </TableCell>

                                            {/* Stats Data */}
                                            <TableCell className="text-right font-medium text-emerald-600">
                                                {user.successCount}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-rose-600">
                                                {user.failedCount}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {user.expiredCount}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {formatCurrency(user.totalDeposit)}
                                            </TableCell>

                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            {isDeveloper && (
                                                <TableCell>
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    <UserRowActions user={user as any} sessionRole={currentUserRole as any} />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href={prevHref}
                                            aria-disabled={page <= 1}
                                            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>

                                    {renderPaginationItems()}

                                    <PaginationItem>
                                        <PaginationNext
                                            href={nextHref}
                                            aria-disabled={page >= totalPages}
                                            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
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
