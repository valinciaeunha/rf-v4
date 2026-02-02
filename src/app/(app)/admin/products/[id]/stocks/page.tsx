import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getAdminProductStocks, getProductSimple, deleteStock } from "@/lib/actions/admin-stocks"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { AddStockDialog } from "./add-stock-dialog"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
// import { DeleteStockButton } from "./delete-stock-button"
import { DeleteStockButton } from "@/app/(app)/admin/products/[id]/stocks/delete-stock-button"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination"

export default async function AdminProductStocksPage(props: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ page?: string }>
}) {
    const params = await props.params
    const searchParams = await props.searchParams

    const productId = parseInt(params.id)
    if (isNaN(productId)) notFound()

    const page = Number(searchParams.page) || 1
    const limit = 20

    const product = await getProductSimple(productId)
    if (!product) notFound()

    const { data: stocks, pagination } = await getAdminProductStocks(productId, page, limit)

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount))
    }

    const getPageHref = (pageNum: number) => {
        return `?page=${pageNum}`
    }

    const renderPaginationItems = () => {
        const items = []
        const totalPages = pagination.totalPages
        const maxVisible = 5

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
            const start = Math.max(2, page - 1)
            const end = Math.min(totalPages - 1, page + 1)
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
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="h-8 w-8">
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manajemen Stock</h2>
                    <p className="text-muted-foreground">
                        Kelola kode stock untuk produk: <span className="font-medium text-foreground">{product.name}</span>
                    </p>
                </div>
            </div>

            <Card className="w-full overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Daftar Stock</CardTitle>
                        <CardDescription>
                            Total {pagination.total} stock tersedia
                        </CardDescription>
                    </div>
                    <AddStockDialog productId={product.id} productName={product.name} />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Kode Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Ditambahkan</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-muted-foreground">Belum ada stock</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stocks.map((stock, i) => (
                                        <TableRow key={stock.id}>
                                            <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">{stock.code}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={stock.status === 'ready' ? 'secondary' : 'default'}
                                                    className={`text-[10px] uppercase ${stock.status === 'ready' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}`}
                                                >
                                                    {stock.status === 'ready' ? 'Tersedia' : 'Terjual'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {formatDistanceToNow(new Date(stock.createdAt), { addSuffix: true, locale: idLocale })}
                                            </TableCell>
                                            <TableCell>
                                                {stock.status === 'ready' && (
                                                    <DeleteStockButton stockId={stock.id} productId={productId} />
                                                )}
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
                                            href={getPageHref(Math.max(1, page - 1))}
                                            aria-disabled={page <= 1}
                                            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>

                                    {renderPaginationItems()}

                                    <PaginationItem>
                                        <PaginationNext
                                            href={getPageHref(Math.min(pagination.totalPages, page + 1))}
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
