import { getAdminProducts } from "@/lib/actions/admin-products"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { Package } from "lucide-react"
import { ProductSearch } from "./search"
import { AddProductDialog } from "./add-product-dialog"
import { ProductRowActions } from "./product-row-actions"

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>
}) {
    const params = await searchParams
    const query = params.q || ""
    const page = Number(params.page) || 1

    const { data: products, pagination } = await getAdminProducts(query, page, 20)

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount))
    }

    const getPageHref = (pageNum: number) => {
        return `?q=${query}&page=${pageNum}`
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
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Produk</h2>
                    <p className="text-muted-foreground">
                        Kelola produk dan stok di sini.
                    </p>
                </div>
            </div>

            <Card className="w-full overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Daftar Produk</CardTitle>
                        <CardDescription>
                            {pagination.total} produk ditemukan
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <ProductSearch />
                        <AddProductDialog />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product ID</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead className="text-right">Harga Jual</TableHead>
                                    <TableHead className="text-right">Harga Beli</TableHead>
                                    <TableHead className="text-center">Stock</TableHead>
                                    <TableHead className="text-center">Tipe</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-8 w-8 text-muted-foreground/50" />
                                                <p className="text-muted-foreground">Belum ada produk</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium font-mono text-xs">
                                                {product.productId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{product.name}</span>
                                                    {product.badge && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {product.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {formatCurrency(product.price)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                {formatCurrency(product.buyPrice)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={product.stockCount > 0 ? "default" : "secondary"}>
                                                    {product.stockCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {product.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={product.status === "active" ? "default" : "secondary"}
                                                    className="text-[10px] uppercase"
                                                >
                                                    {product.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                <ProductRowActions product={product as any} />
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
