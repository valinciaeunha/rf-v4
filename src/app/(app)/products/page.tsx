"use client"

import { useEffect, useState } from "react"
import { Check, ShoppingCart, Search, Star, Loader2, Cpu, Smartphone, HardDrive, Layers, MemoryStick, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getProducts } from "@/lib/actions/products"
import useSWR from "swr"

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number).replace("IDR", "Rp").trim()
}

const getDurationLabel = (days: number) => {
    if (days === 1) return "Harian"
    if (days === 7) return "Mingguan"
    if (days === 30) return "Bulanan"
    if (days === 365) return "Tahunan"
    return "Lainnya"
}

export default function ProductsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeFilter, setActiveFilter] = useState("Semua")

    const filters = ["Semua", "Harian", "Mingguan", "Bulanan", "Tahunan"]

    const fetcher = async () => {
        const res = await getProducts()
        if (!res.success) throw new Error(res.error)
        return res.data
    }

    const { data: products, error, isLoading } = useSWR('products-list', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 3600000,
        keepPreviousData: true,
        fallbackData: [],
    })

    const filteredProducts = (products || []).filter((product: any) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const durationLabel = getDurationLabel(product.durationDays)
        const matchesFilter = activeFilter === "Semua" || durationLabel === activeFilter
        return matchesSearch && matchesFilter
    })

    const showSkeleton = isLoading && (!products || products.length === 0)

    if (showSkeleton) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between max-w-7xl mx-auto w-full bg-card/50 p-3 rounded-lg border border-border/50 backdrop-blur-sm sticky top-16 z-30">
                    <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 items-center no-scrollbar">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-7 w-16 rounded-full shrink-0" />
                        ))}
                    </div>
                    <div className="w-full md:w-56">
                        <Skeleton className="h-8 w-full rounded-full" />
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto w-full">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col p-3 rounded-lg border border-border/50 bg-card/20 h-full">
                            <Skeleton className="h-4 w-3/4 mb-1.5" />
                            <div className="mb-2 flex flex-row items-baseline gap-1">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-2.5 w-8" />
                            </div>
                            <div className="flex-1 space-y-1 mb-2.5">
                                {[...Array(5)].map((_, j) => (
                                    <div key={j} className="flex items-center gap-1">
                                        <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                                        <Skeleton className="h-2.5 w-4/5" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto pt-2 border-t border-border/40">
                                <div className="flex justify-between items-center mb-2">
                                    <Skeleton className="h-3 w-16 rounded" />
                                    <Skeleton className="h-2.5 w-12" />
                                </div>
                                <Skeleton className="h-8 w-full rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between max-w-7xl mx-auto w-full bg-card/50 p-3 rounded-lg border border-border/50 backdrop-blur-sm sticky top-16 z-30 transition-all">
                <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar items-center">
                    {filters.map((filter) => (
                        <Button
                            key={filter}
                            variant={activeFilter === filter ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveFilter(filter)}
                            className="whitespace-nowrap rounded-full px-3 h-7 text-[11px] font-medium"
                        >
                            {filter}
                        </Button>
                    ))}
                </div>
                <div className="relative w-full md:w-56">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-[12px] bg-background/50 border-border/50 focus:bg-background transition-colors rounded-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto w-full">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product: any) => {
                        const isFeatured = product.popular
                        const isSoldOut = product.stock === 0
                        const price = parseFloat(product.price)

                        return (
                            <div
                                key={product.id}
                                className={`relative flex flex-col p-3 rounded-lg border transition-all duration-300 
                                    ${isFeatured && !isSoldOut ? 'border-primary/50 shadow-xl z-10 bg-gradient-to-b from-background to-primary/5' : ''} 
                                    ${isSoldOut ? 'border-border/30 bg-muted/10 opacity-60 grayscale-[0.3]' : 'border-border/50 hover:bg-muted/30 hover:border-border'}
                                `}
                            >
                                {isFeatured && !isSoldOut && (
                                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[50%] w-full flex justify-center">
                                        <Badge className="bg-primary text-primary-foreground font-bold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border-0">
                                            {product.badge}
                                        </Badge>
                                    </div>
                                )}

                                {isSoldOut && (
                                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[50%] w-full flex justify-center z-20">
                                        <Badge variant="secondary" className="font-bold text-[9px] uppercase px-3 py-0.5 rounded-full shadow-md whitespace-nowrap border-0">
                                            HABIS
                                        </Badge>
                                    </div>
                                )}

                                <h3 className="text-[13px] font-bold text-foreground leading-tight mb-1.5">{product.name}</h3>

                                <div className="mb-2 flex flex-row items-baseline gap-1">
                                    <span className="text-[16px] font-bold text-foreground tracking-tight">{formatRupiah(price)}</span>
                                    <span className="text-muted-foreground text-[9px] font-medium">/ {product.durationDays}D</span>
                                </div>

                                <ul className="mb-2.5 space-y-1 flex-1">
                                    {(Array.isArray(product.features) ? product.features : [])
                                        .map((feature: any, i: number) => {
                                            const label = typeof feature === 'string' ? feature : feature.label;
                                            const iconType = typeof feature === 'string' ? 'cpu' : feature.icon;

                                            let Icon = Check;
                                            if (iconType === 'cpu' || iconType === 'chipset') Icon = Cpu;
                                            else if (iconType === 'ram') Icon = MemoryStick;
                                            else if (iconType === 'os') Icon = Smartphone;
                                            else if (iconType === 'storage') Icon = HardDrive;
                                            else if (iconType === 'bit') Icon = Layers;
                                            else if (iconType === 'globe') Icon = Globe;

                                            if (label.toLowerCase().includes('cpu')) Icon = Cpu;

                                            return (
                                                <li key={i} className="flex items-center text-[10px] text-foreground/80 font-medium">
                                                    <Icon className="h-2.5 w-2.5 text-primary mr-1 shrink-0" />
                                                    <span className="line-clamp-1">{label}</span>
                                                </li>
                                            )
                                        })}
                                </ul>

                                <div className="mt-auto pt-2 border-t border-border/40">
                                    <div className="flex items-center justify-between mb-2 text-[9px]">
                                        <div className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">
                                            {product.reviewCount > 0 ? (
                                                <div className="flex items-center text-amber-500 font-bold">
                                                    <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                                                    {product.rating}
                                                    <span className="text-[8px] text-muted-foreground font-normal ml-0.5">({product.reviewCount})</span>
                                                </div>
                                            ) : (
                                                <span className="text-[8px] text-muted-foreground font-normal">Belum ada ulasan</span>
                                            )}
                                            <span className="text-border">|</span>
                                            <span>{product.sold?.toLocaleString()} Sold</span>
                                        </div>
                                        <span className={`font-medium ${isSoldOut ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {product.stock === 0 ? "Habis" : `Stok: ${product.stock}`}
                                        </span>
                                    </div>

                                    {isSoldOut ? (
                                        <Button
                                            disabled
                                            size="sm"
                                            variant="secondary"
                                            className="w-full h-8 rounded-md font-semibold text-[10px] opacity-100"
                                        >
                                            <ShoppingCart className="w-3 h-3 mr-1" />
                                            Stok Habis
                                        </Button>
                                    ) : (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant={isFeatured ? "default" : "outline"}
                                            className={`w-full h-8 rounded-md font-semibold text-[10px] ${isFeatured ? 'shadow-sm shadow-primary/25' : ''}`}
                                        >
                                            <a href={`/checkout?product=${product.id}`}>
                                                <ShoppingCart className="w-3 h-3 mr-1" />
                                                Beli Sekarang
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full text-center py-20">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Tidak ada produk ditemukan</h3>
                        <p className="text-muted-foreground text-sm mt-1">Coba kata kunci lain atau ubah filter kategori Anda.</p>
                        <Button variant="link" onClick={() => { setSearchTerm(""); setActiveFilter("Semua") }} className="mt-2">
                            Reset Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
