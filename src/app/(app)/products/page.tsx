"use client"

import { useEffect, useState } from "react"
import { Check, ShoppingCart, Search, Star, Loader2, Cpu, Smartphone, HardDrive, Layers, MemoryStick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getProducts } from "@/lib/actions/products"

// ... imports

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number).replace("IDR", "Rp").trim()
}

import useSWR from "swr"

// Helper moved outside or inside component
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
        revalidateOnFocus: false, // Don't revalidate on window focus (prevent flicker)
        dedupingInterval: 3600000, // Cache for 1 hour as requested
        keepPreviousData: true, // Keep data while revalidating
        fallbackData: [], // Initial empty state, handled by isLoading
    })

    const filteredProducts = (products || []).filter((product: any) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const durationLabel = getDurationLabel(product.durationDays)
        const matchesFilter = activeFilter === "Semua" || durationLabel === activeFilter
        return matchesSearch && matchesFilter
    })

    // Show skeleton if loading AND we have no data yet (or empty fallback)
    // If we have cached data, we show that instead (stale-while-revalidate)
    const showSkeleton = isLoading && (!products || products.length === 0)

    if (showSkeleton) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
                {/* Filter & Search Skeleton */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-7xl mx-auto w-full bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm sticky top-16 z-30">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 items-center no-scrollbar">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
                        ))}
                    </div>
                    <div className="w-full md:w-72">
                        <Skeleton className="h-10 w-full rounded-full" />
                    </div>
                </div>

                {/* Product Grid Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto w-full">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col p-4 md:p-5 rounded-xl border border-border/50 bg-card/20 h-full">
                            {/* Title */}
                            <Skeleton className="h-5 w-3/4 mb-3" />

                            {/* Price */}
                            <div className="mb-4 flex flex-col md:flex-row md:items-baseline gap-2">
                                <Skeleton className="h-7 w-1/2" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>

                            {/* Specs List */}
                            <div className="flex-1 space-y-2 mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <div key={j} className="flex items-center gap-2">
                                        <Skeleton className="h-3 w-3 rounded-full" />
                                        <Skeleton className="h-3 w-4/5" />
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-3 border-t border-border/40">
                                <div className="flex justify-between items-center mb-3">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-9 w-full rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-7xl mx-auto w-full bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm sticky top-16 z-30 transition-all">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar items-center">
                    {filters.map((filter) => (
                        <Button
                            key={filter}
                            variant={activeFilter === filter ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveFilter(filter)}
                            className="whitespace-nowrap rounded-full px-4 font-medium"
                        >
                            {filter}
                        </Button>
                    ))}
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors rounded-full"
                    />
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto w-full">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                        const isFeatured = product.popular
                        const isSoldOut = product.stock === 0
                        const price = parseFloat(product.price)

                        return (
                            <div key={product.id} className={`relative flex flex-col p-4 md:p-5 rounded-xl border transition-all duration-300 ${isFeatured && !isSoldOut ? 'border-primary/50 shadow-2xl z-10 bg-gradient-to-b from-background to-primary/5' : ''} ${isSoldOut ? 'border-border/50 bg-muted/20' : 'border-border/50 hover:bg-muted/30 hover:border-border'}`}>
                                {isFeatured && !isSoldOut && (
                                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[50%] w-full flex justify-center">
                                        <Badge className="bg-primary text-primary-foreground font-bold text-[10px] uppercase px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap border-0">
                                            {product.badge}
                                        </Badge>
                                    </div>
                                )}

                                {isSoldOut && (
                                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-[50%] w-full flex justify-center z-20">
                                        <Badge variant="secondary" className="font-bold text-[10px] uppercase px-4 py-0.5 rounded-full shadow-lg whitespace-nowrap border-0">
                                            HABIS
                                        </Badge>
                                    </div>
                                )}

                                <div className="mb-2 md:mb-3">
                                    <h3 className="text-sm md:text-lg font-bold text-foreground">{product.name}</h3>
                                </div>

                                <div className="mb-3 md:mb-4 flex flex-row items-baseline gap-1">
                                    <span className="text-lg md:text-2xl font-bold text-foreground tracking-tighter">{formatRupiah(price)}</span>
                                    <span className="text-muted-foreground text-[8px] md:text-[10px] font-medium">/ {product.durationDays} Hari</span>
                                </div>

                                <ul className="mb-3 md:mb-5 space-y-1.5 md:space-y-2 flex-1">
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

                                            // Fallback heuristic
                                            if (label.toLowerCase().includes('cpu')) Icon = Cpu;

                                            return (
                                                <li key={i} className="flex items-start text-[9px] md:text-xs text-foreground/90 font-medium leading-tight">
                                                    <Icon className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-primary mr-1.5 shrink-0 mt-0.5" />
                                                    <span className="truncate md:whitespace-normal">{label}</span>
                                                </li>
                                            )
                                        })}
                                </ul>

                                {/* Rating, Sold & Stock Indicator */}
                                <div className="mt-auto pt-2 md:pt-3 border-t border-border/40">
                                    <div className="flex items-center justify-between mb-2 md:mb-3 text-[8px] md:text-[10px]">
                                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                                            <div className="flex items-center text-amber-500 font-bold">
                                                <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current mr-0.5" />
                                                {product.rating}
                                            </div>
                                            <div className="w-px h-2 bg-border" />
                                            <span>{product.sold?.toLocaleString()} Terjual</span>
                                        </div>

                                        <div className="text-muted-foreground font-medium">
                                            {product.stock === 0 ? "Habis" : `Stok: ${product.stock}`}
                                        </div>
                                    </div>

                                    <Button
                                        asChild
                                        size="sm"
                                        variant={isFeatured ? "default" : "outline"}
                                        disabled={isSoldOut}
                                        className={`w-full h-8 md:h-9 rounded-lg font-bold tracking-wide text-[10px] md:text-xs shadow-sm ${isFeatured ? 'shadow-primary/25' : ''}`}
                                    >
                                        <a href={isSoldOut ? "#" : `/checkout?product=${product.id}`}>
                                            <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5" />
                                            {isSoldOut ? "Stok Habis" : "Beli Sekarang"}
                                        </a>
                                    </Button>
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
