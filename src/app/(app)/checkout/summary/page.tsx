"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Lock, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getProductById, ProductData } from "@/lib/actions/products"
import { getSessionUser } from "@/lib/actions/auth"
import { createProductOrder } from "@/lib/actions/orders"
import { toast } from "sonner"

function CheckoutSummaryContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const productId = searchParams.get("product")
    const qty = parseInt(searchParams.get("qty") || "1")
    const paymentMethod = searchParams.get("payment") || "qris_realtime"

    const [product, setProduct] = useState<ProductData | null>(null)
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState("")
    const [whatsapp, setWhatsapp] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!productId) {
            setLoading(false)
            return
        }

        const fetchProduct = async () => {
            try {
                const res = await getProductById(productId)
                if (res.success && res.data) {
                    setProduct(res.data)
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

        // Auto-fill user data
        const fetchUser = async () => {
            const session = await getSessionUser()
            if (session) {
                setEmail(session.email || "")
                setWhatsapp(session.whatsappNumber || "")
            }
        }
        fetchUser()
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
    const subtotal = price * qty

    // Calculate Admin Fee
    let adminFee = 0
    if (paymentMethod.includes('qris')) {
        // Fee QRIS Realtime 1.70% (Dibebankan ke pelanggan)
        // Kita bulatkan ke atas
        adminFee = Math.ceil(subtotal * 0.017)
    }

    const total = subtotal + adminFee

    const handlePay = async () => {
        if (!email || !whatsapp) {
            toast.error("Mohon lengkapi Email dan WhatsApp")
            return
        }

        if (!product) {
            toast.error("Produk tidak ditemukan")
            return
        }

        setIsSubmitting(true)

        try {
            // Create product order - will insert to transactions table
            const res = await createProductOrder({
                productId: product.id,
                quantity: qty,
                paymentMethod: paymentMethod as any,
                email,
                whatsappNumber: whatsapp,
            })

            if (res.success && res.data) {
                if (res.data.fulfilled) {
                    // Balance payment - redirect to success page
                    toast.success("Pembelian berhasil!")
                    router.push(`/payment/success?id=${res.data.orderId}`)
                } else {
                    // QRIS/External payment - redirect to QR payment page
                    router.push(`/payment/${res.data.orderId}`)
                }
            } else {
                toast.error(res.error || "Gagal membuat transaksi")
                setIsSubmitting(false)
            }
        } catch (error) {
            console.error(error)
            toast.error("Terjadi kesalahan sistem")
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
            <Button variant="ghost" size="sm" className="w-fit -ml-2 h-7 text-muted-foreground hover:text-foreground text-xs" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-3 w-3" />
                Kembali
            </Button>

            <div className="text-center mb-1">
                <h1 className="text-lg md:text-xl font-bold tracking-tight">Konfirmasi Pesanan</h1>
                <p className="text-muted-foreground text-[10px] md:text-xs">Lengkapi data diri untuk pengiriman akses.</p>
            </div>

            <Card className="border-border/50 shadow-lg p-0 gap-0 overflow-hidden">
                <CardHeader className="bg-muted/30 !p-3 md:!p-4 border-b border-border/50 flex flex-row items-center gap-2 space-y-0">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                        <Lock className="h-3 w-3 text-primary" />
                        Detail Pembelian
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 space-y-4">
                    {/* Item Review */}
                    <div className="flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm">{product.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{qty} Barang</Badge>
                                <span className="text-[10px] md:text-xs text-muted-foreground">{formatRupiah(price)}</span>
                            </div>
                        </div>
                        <div className="font-bold text-sm">
                            {formatRupiah(subtotal)}
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* User Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-[10px] md:text-xs">Email Penerima</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="contoh@email.com"
                                className="h-8 text-xs"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="wa" className="text-[10px] md:text-xs">Nomor WhatsApp</Label>
                            <Input
                                id="wa"
                                type="tel"
                                placeholder="0812...."
                                className="h-8 text-xs"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Cost Breakdown */}
                    <div className="bg-muted/10 p-3 rounded-lg space-y-1.5 border border-border/30">
                        <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                            <span>Biaya Layanan {paymentMethod.includes('qris') ? '(QRIS 1.7%)' : ''}</span>
                            <span>{formatRupiah(adminFee)}</span>
                        </div>
                        <Separator className="my-1 bg-border/50" />
                        <div className="flex justify-between font-bold text-sm md:text-base pt-0.5">
                            <span>Total</span>
                            <span className="text-primary">{formatRupiah(total)}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/10 p-3 md:p-4 flex flex-col gap-2 border-t border-border/50">
                    <Button
                        className="w-full font-bold h-9 text-xs shadow-md shadow-primary/20"
                        onClick={handlePay}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Memproses..." : `Bayar Sekarang - ${paymentMethod.replace(/_/g, " ").toUpperCase()}`}
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
                        Transaksi Aman & Terenkripsi
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

import { Skeleton } from "@/components/ui/skeleton"

function LoadingFallback() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
            <div className="w-fit">
                <Skeleton className="h-7 w-24" />
            </div>

            <div className="text-center mb-1 flex flex-col items-center gap-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            <Card className="border-border/50 shadow-lg p-0 gap-0 overflow-hidden">
                <CardHeader className="bg-muted/30 !p-3 md:!p-4 border-b border-border/50">
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="p-3 md:p-4 space-y-4">
                    {/* Item Review */}
                    <div className="flex gap-3 items-center">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <div className="flex gap-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-24" />
                    </div>

                    <Separator className="bg-border/50" />

                    {/* User Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Cost Breakdown */}
                    <div className="bg-muted/10 p-3 rounded-lg space-y-2 border border-border/30">
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-10" />
                        </div>
                        <Separator className="my-1 bg-border/50" />
                        <div className="flex justify-between pt-0.5">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/10 p-3 md:p-4 flex flex-col gap-2 border-t border-border/50">
                    <Skeleton className="h-9 w-full" />
                    <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function CheckoutSummaryPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CheckoutSummaryContent />
        </Suspense>
    )
}

