"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Check, ArrowRight, Minus, Plus, Wallet, Smartphone, QrCode, Cpu, MemoryStick, HardDrive, Layers, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
// import { getProductById, Product } from "@/lib/api/products"
// import { getWalletBalance } from "@/lib/api/wallet"
import { getProductById, ProductData } from "@/lib/actions/products"
import { getWalletBalance } from "@/lib/actions/wallet"
import { toast } from "sonner"

const getProductType = (days: number) => {
    if (days === 1) return "Harian"
    if (days === 7) return "Mingguan"
    if (days === 30) return "Bulanan"
    if (days === 365) return "Tahunan"
    return "Lainnya"
}

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const productId = searchParams.get("product")

    // State
    const [product, setProduct] = useState<(ProductData & { typeLabel: string }) | null>(null)
    const [balance, setBalance] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState("qris")

    useEffect(() => {
        if (!productId) {
            setLoading(false)
            return
        }

        const fetchProduct = async () => {
            try {
                const res = await getProductById(productId)
                if (res.success && res.data) {
                    setProduct({
                        ...res.data,
                        typeLabel: getProductType(res.data.durationDays)
                    })
                } else {
                    toast.error("Gagal memuat produk")
                }
            } catch (error) {
                console.error(error)
                toast.error("Terjadi kesalahan koneksi")
            } finally {
                setLoading(false)
            }
        }

        fetchProduct()

        // Fetch user balance
        const fetchBalance = async () => {
            try {
                const res = await getWalletBalance()
                if (res.success && res.data) {
                    setBalance(parseFloat(res.data.balance) || 0)
                }
            } catch (error) {
                console.error(error)
            }
        }
        fetchBalance()
    }, [productId])

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number).replace("IDR", "Rp").trim()
    }

    if (loading) {
        return <LoadingFallback />
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                <h2 className="text-xl font-bold mb-2">Produk tidak ditemukan</h2>
                <Button onClick={() => router.push("/products")}>Kembali ke Toko</Button>
            </div>
        )
    }

    const price = parseFloat(product.price)
    const totalPrice = price * quantity

    const handleContinue = () => {
        const params = new URLSearchParams()
        params.set("product", product.id.toString())
        params.set("qty", quantity.toString())
        params.set("payment", paymentMethod)
        router.push(`/checkout/summary?${params.toString()}`)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 w-full max-w-[1600px] mx-auto">
            <div className="flex flex-col space-y-0.5">
                <h1 className="text-lg md:text-xl font-bold tracking-tight">Konfigurasi Pesanan</h1>
                <p className="text-muted-foreground text-[10px] md:text-xs">Sesuaikan jumlah dan pilih metode pembayaran.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Left Column: Config */}
                <div className="md:col-span-2 space-y-3 relative">
                    {/* Product Details */}
                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="!p-3 flex flex-row items-center gap-2 space-y-0 border-b border-border/50 bg-muted/20">
                            <CardTitle className="text-sm md:text-base">Detail Produk</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="font-bold text-sm">{product.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{product.typeLabel}</Badge>
                                        <span className="text-xs md:text-sm font-bold text-primary">{formatRupiah(price)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2.5 bg-muted/20 p-2 rounded-md border border-border/30">
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                    {product.features.slice(0, 4).map((feature: any, i: number) => {
                                        const label = typeof feature === 'string' ? feature : feature.label;
                                        const iconType = typeof feature === 'string' ? 'check' : feature.icon;

                                        let Icon = Check;
                                        if (iconType === 'cpu' || iconType === 'chipset') Icon = Cpu;
                                        else if (iconType === 'ram') Icon = MemoryStick;
                                        else if (iconType === 'os') Icon = Smartphone;
                                        else if (iconType === 'storage') Icon = HardDrive;
                                        else if (iconType === 'bit') Icon = Layers;
                                        else if (iconType === 'globe') Icon = Globe;

                                        return (
                                            <li key={i} className="flex items-center text-[10px] text-muted-foreground">
                                                <Icon className="h-2.5 w-2.5 text-primary mr-1.5 shrink-0" />
                                                <span className="truncate">{label}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quantity */}
                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="!p-3 flex flex-row items-center gap-2 space-y-0 border-b border-border/50 bg-muted/20">
                            <CardTitle className="text-sm md:text-base">Jumlah Item</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="flex items-center justify-between p-2.5 border border-border/50 rounded-md bg-muted/10">
                                <div className="flex flex-col">
                                    <span className="text-xs md:text-sm font-medium">Kuantitas</span>
                                    <span className="text-[10px] text-muted-foreground">Maksimal {product.stock} unit</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center text-xs md:text-sm font-bold">{quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        disabled={quantity >= product.stock}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="!p-3 flex flex-row items-center gap-2 space-y-0 border-b border-border/50 bg-muted/20">
                            <CardTitle className="text-sm md:text-base">Metode Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={paymentMethod === "qris_realtime" ? "default" : "outline"}
                                    className={`h-auto py-2.5 justify-start px-3 ${paymentMethod === "qris_realtime" ? "border-primary shadow-sm" : "border-border/50 hover:bg-muted/50"}`}
                                    onClick={() => setPaymentMethod("qris_realtime")}
                                >
                                    <QrCode className="mr-2.5 h-4 w-4 shrink-0" />
                                    <div className="flex flex-col items-start truncate">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-xs">QRIS Realtime</span>
                                            <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">INSTAN</Badge>
                                        </div>
                                        <span className="text-[10px] opacity-80 truncate hidden md:block">Scan langsung lunas</span>
                                    </div>
                                </Button>
                                <Button
                                    variant={paymentMethod === "balance" ? "default" : "outline"}
                                    className={`h-auto py-2.5 justify-start px-3 ${paymentMethod === "balance" ? "border-primary shadow-sm" : "border-border/50 hover:bg-muted/50"}`}
                                    onClick={() => setPaymentMethod("balance")}
                                >
                                    <Wallet className="mr-2.5 h-4 w-4 shrink-0" />
                                    <div className="flex flex-col items-start truncate">
                                        <span className="font-bold text-xs">Balance</span>
                                        <span className="text-[10px] opacity-80 truncate hidden md:block">Potong Saldo Akun</span>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary */}
                <div className="md:col-span-1 space-y-3">
                    {/* Balance Card */}
                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                    <Wallet className="h-4 w-4 text-emerald-500" />
                                </div>
                                <span className="text-xs md:text-sm font-medium text-muted-foreground">Saldo Anda</span>
                            </div>
                            <span className="font-bold text-sm md:text-base text-emerald-500">{formatRupiah(balance)}</span>
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card className="sticky top-20 border-border/50 shadow-lg bg-card/50 backdrop-blur-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="bg-muted/20 !p-3 md:!p-4 border-b border-border/50 flex flex-row items-center gap-2 space-y-0">
                            <CardTitle className="text-base">Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Harga Satuan</span>
                                <span>{formatRupiah(price)}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Jumlah</span>
                                <span>x {quantity}</span>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="flex justify-between items-center pt-1">
                                <span className="font-bold text-sm md:text-base">Total</span>
                                <span className="font-bold text-lg md:text-xl text-primary">{formatRupiah(totalPrice)}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-2">
                            <Button className="w-full font-bold h-10 text-xs md:text-sm shadow-md shadow-primary/20" onClick={handleContinue}>
                                Lanjut Pembayaran
                                <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

import { Skeleton } from "@/components/ui/skeleton"

function LoadingFallback() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 w-full max-w-[1600px] mx-auto">
            <div className="flex flex-col space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Left Column Skeleton */}
                <div className="md:col-span-2 space-y-3">
                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="!p-3 border-b border-border/50 bg-muted/20">
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="flex gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-48" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2.5 bg-muted/20 p-2 rounded-md border border-border/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="!p-3 border-b border-border/50 bg-muted/20">
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent className="p-3">
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="!p-3 border-b border-border/50 bg-muted/20">
                            <Skeleton className="h-5 w-40" />
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column Skeleton */}
                <div className="md:col-span-1 space-y-3">
                    <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden">
                        <CardContent className="p-3 flex items-center justify-between">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-6 w-24" />
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="bg-muted/20 !p-3 md:!p-4 border-b border-border/50">
                            <Skeleton className="h-6 w-24" />
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-24" /></div>
                            <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-10" /></div>
                            <Separator className="bg-border/50" />
                            <div className="flex justify-between"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-32" /></div>
                        </CardContent>
                        <CardFooter className="p-4 pt-2">
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CheckoutContent />
        </Suspense>
    )
}
