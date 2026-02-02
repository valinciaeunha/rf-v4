"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import QRCode from "react-qr-code"
import { Copy, Clock, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getDepositByTrxId } from "@/lib/actions/wallet"
import { getTransactionByOrderId } from "@/lib/actions/orders"
import { Skeleton } from "@/components/ui/skeleton"
import { PAYMENT_TIMEOUT_MINUTES_CLIENT } from "@/lib/payment-config"

export default function PaymentPage() {
    const params = useParams()
    const router = useRouter()
    const depositIdentifier = params.id as string

    // State for deposit data
    const [deposit, setDeposit] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_MINUTES_CLIENT * 60)
    const [status, setStatus] = useState<"pending" | "success" | "expired">("pending")
    const [isChecking, setIsChecking] = useState(false)

    useEffect(() => {
        const fetchPaymentData = async () => {
            if (!depositIdentifier) return

            try {
                // First try to find in deposits table (for top-up)
                const depositRes = await getDepositByTrxId(depositIdentifier)

                if (depositRes.success && depositRes.data) {
                    setDeposit(depositRes.data)
                    setStatus(depositRes.data.status === "success" ? "success" : depositRes.data.status === "expired" ? "expired" : "pending")

                    // Timer based on CreatedAt + 15 minutes
                    const createdAt = new Date(depositRes.data.createdAt).getTime()
                    const EXPIRE_DURATION = PAYMENT_TIMEOUT_MINUTES_CLIENT * 60 * 1000
                    const expireTime = createdAt + EXPIRE_DURATION
                    const now = Date.now()
                    const remaining = Math.max(0, Math.floor((expireTime - now) / 1000))

                    if (remaining <= 0 && depositRes.data.status === "pending") {
                        setTimeLeft(0)
                        setStatus("expired")
                    } else if (depositRes.data.status === "expired") {
                        setTimeLeft(0)
                    } else {
                        setTimeLeft(remaining)
                    }
                } else {
                    // If not found in deposits, try transactions table (for product orders)
                    const txRes = await getTransactionByOrderId(depositIdentifier)

                    if (txRes.success && txRes.data) {
                        setDeposit(txRes.data)
                        setStatus(txRes.data.status === "success" ? "success" : txRes.data.status === "expired" ? "expired" : "pending")

                        // Timer based on expiredAt or createdAt + 15 minutes
                        const expireTime = txRes.data.expiredAt
                            ? new Date(txRes.data.expiredAt).getTime()
                            : new Date(txRes.data.createdAt).getTime() + PAYMENT_TIMEOUT_MINUTES_CLIENT * 60 * 1000
                        const now = Date.now()
                        const remaining = Math.max(0, Math.floor((expireTime - now) / 1000))

                        if (remaining <= 0 && txRes.data.status === "pending") {
                            setTimeLeft(0)
                            setStatus("expired")
                        } else if (txRes.data.status === "expired") {
                            setTimeLeft(0)
                        } else {
                            setTimeLeft(remaining)
                        }
                    } else {
                        setError("Pembayaran tidak ditemukan")
                    }
                }
            } catch (err) {
                console.error(err)
                setError("Gagal memuat data pembayaran")
            } finally {
                setLoading(false)
            }
        }

        fetchPaymentData()
    }, [depositIdentifier])

    // Derived values from fetched data
    const amount = deposit?.amount || 0
    const method = deposit?.method?.toLowerCase() || "qris"
    const qrLink = deposit?.qrLink || ""
    const qrString = deposit?.qrString || ""
    const payUrl = deposit?.payUrl || ""
    const nomorVa = deposit?.nomorVa || ""
    const trxId = deposit?.trxId || deposit?.orderId || ""
    const depositRefId = deposit?.refId || deposit?.publicId || ""

    // Polling uses numeric ID if available, otherwise identifier from URL if it works with API
    const depositId = deposit?.id

    // Determine payment type
    // Prioritize QR String if available for rendering
    const isQris = method.includes("qris") || (!!qrLink || !!qrString)
    const isVA = method.includes("bri") || method.includes("bca") || method.includes("bni") ||
        method.includes("mandiri") || method.includes("permata") || method.includes("cimb") ||
        method.includes("danamon") || method.includes("bsi")
    const isEwallet = method.includes("shopeepay") || method.includes("gopay") || method.includes("dana") ||
        method.includes("ovo") || method.includes("linkaja") || method.includes("astrapay")

    useEffect(() => {
        if (status !== "pending") return

        // Countdown Timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    if (status === "pending") setStatus("expired")
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Polling Check Status every 10 seconds
        const poller = setInterval(async () => {
            if (status === "pending" && deposit) {
                try {
                    // Build query params based on payment type
                    const params = new URLSearchParams()
                    if (deposit.paymentType === "product" && deposit.orderId) {
                        params.append("order_id", deposit.orderId)
                    } else if (depositId) {
                        params.append("deposit_id", depositId.toString())
                    } else if (trxId) {
                        params.append("ref_id", trxId)
                    }

                    const response = await fetch(`/api/tokopay/sync?${params.toString()}`)
                    const data = await response.json()

                    if (data.deposit?.status === "success") {
                        setStatus("success")
                        toast.success("Pembayaran berhasil!")
                        clearInterval(poller)
                    } else if (data.deposit?.status === "expired") {
                        setStatus("expired")
                        toast.error("Pembayaran kedaluwarsa")
                        clearInterval(poller)
                    }
                } catch (e) {
                    console.error("Polling error", e)
                }
            }
        }, 10000)

        return () => {
            clearInterval(timer)
            clearInterval(poller)
        }
    }, [status, depositId, deposit, trxId])

    // Auto-redirect on success
    useEffect(() => {
        if (status === "success") {
            const timeout = setTimeout(() => {
                router.push(`/payment/success?id=${depositIdentifier}`)
            }, 1500) // Delay 1.5s to show success toast/state briefly
            return () => clearTimeout(timeout)
        }
    }, [status, depositIdentifier, router])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number).replace("IDR", "Rp").trim()
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} berhasil disalin!`)
    }

    const checkPaymentStatus = async () => {
        setIsChecking(true)
        try {
            // Build query params based on available data
            const params = new URLSearchParams()
            if (deposit?.paymentType === "product" && deposit?.orderId) {
                params.append("order_id", deposit.orderId)
            } else if (depositId) {
                params.append("deposit_id", depositId.toString())
            } else if (trxId) {
                params.append("ref_id", trxId)
            }

            const response = await fetch(`/api/tokopay/sync?${params.toString()}`)
            const data = await response.json()

            if (data.deposit?.status === "success") {
                setStatus("success")
                toast.success("Pembayaran berhasil!")
            } else if (data.deposit?.status === "expired") {
                setStatus("expired")
                toast.error("Pembayaran kedaluwarsa")
            } else {
                // Show more detail if available from Tokopay
                const tpStatus = data.tokopay?.data?.status || data.tokopay?.status
                if (tpStatus) {
                    toast.info(`Status dari Tokopay: ${tpStatus}. Silakan coba lagi.`)
                } else {
                    toast.info("Pembayaran belum diterima, silakan coba lagi")
                }
            }
        } catch (error) {
            toast.error("Gagal mengecek status pembayaran")
        } finally {
            setIsChecking(false)
        }
    }

    const getMethodName = (method: string) => {
        const names: Record<string, string> = {
            qris: "QRIS",
            qris_realtime: "QRIS Realtime",
            bri: "BRI Virtual Account",
            bca: "BCA Virtual Account",
            bni: "BNI Virtual Account",
            mandiri: "Mandiri Virtual Account",
            permata: "Permata Virtual Account",
            cimb: "CIMB Virtual Account",
            danamon: "Danamon Virtual Account",
            bsi: "BSI Virtual Account",
            shopeepay: "ShopeePay",
            gopay: "GoPay",
            dana: "DANA",
            ovo: "OVO",
            linkaja: "LinkAja",
            astrapay: "AstraPay",
            alfamart: "Alfamart",
            indomaret: "Indomaret",
        }
        return names[method] || method.toUpperCase()
    }

    if (loading) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-3 md:p-4 min-h-[calc(100vh-4rem)]">
                <Card className="max-w-2xl w-full border-border/50 shadow-xl relative overflow-hidden bg-card/60 backdrop-blur-sm">
                    {/* Header Skeleton */}
                    <div className="px-4 py-3 bg-muted/20 border-b border-border/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-2 w-20" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-24 rounded-full" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Left Column Skeleton */}
                        <div className="p-5 border-r border-border/50 flex flex-col items-center justify-center space-y-4">
                            <div className="space-y-2 flex flex-col items-center w-full">
                                <Skeleton className="h-2 w-24" />
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-40 w-40 rounded-lg" />
                            <Skeleton className="h-9 w-full rounded" />
                        </div>

                        {/* Right Column Skeleton */}
                        <CardContent className="p-5 space-y-6">
                            {/* Rincian Biaya Skeleton */}
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-32" />
                                <div className="space-y-2 p-3 border rounded">
                                    <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-24" /></div>
                                    <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-24" /></div>
                                    <Skeleton className="h-[1px] w-full my-2" />
                                    <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-28" /></div>
                                </div>
                            </div>

                            {/* Info Pelanggan Skeleton */}
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-32" />
                                <div className="grid grid-cols-2 gap-0 border rounded overflow-hidden">
                                    <div className="p-2 border-r"><Skeleton className="h-2 w-10 mb-2" /><Skeleton className="h-3 w-20" /></div>
                                    <div className="p-2"><Skeleton className="h-2 w-10 mb-2" /><Skeleton className="h-3 w-24" /></div>
                                    <div className="col-span-2 p-2 border-t flex justify-between">
                                        <div className="space-y-1"><Skeleton className="h-2 w-16" /><Skeleton className="h-3 w-32" /></div>
                                        <Skeleton className="h-6 w-6 rounded" />
                                    </div>
                                </div>
                            </div>

                            <Skeleton className="h-10 w-full rounded" />
                        </CardContent>
                    </div>

                    <Separator />
                    <CardFooter className="bg-muted/10 p-4 flex justify-end gap-3">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-32" />
                    </CardFooter>
                </Card>
            </div>
        )
    }



    if (error) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh]">
                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                <h2 className="text-xl font-bold">Error</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/billing")}>
                    Kembali
                </Button>
            </div>
        )
    }

    if (status === "success") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-4">
                <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
                <h1 className="text-2xl font-bold text-green-500">Pembayaran Berhasil!</h1>
                <p className="text-muted-foreground">Mengalihkan ke halaman sukses...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-3 md:p-4 min-h-[calc(100vh-4rem)]">
            <Card className="max-w-2xl w-full border-border/50 shadow-xl relative overflow-hidden bg-card/60 backdrop-blur-sm">

                {/* Header Compact */}
                <div className="px-4 py-3 bg-muted/20 border-b border-border/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary animate-pulse" />
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium leading-none">Sisa Waktu</p>
                            <span className="font-mono font-bold text-sm text-primary">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                    <Badge variant={status === "expired" ? "destructive" : "outline"} className="px-2 py-0.5 text-[10px] uppercase">
                        {status === "expired" ? "Kedaluwarsa" : "Menunggu Pembayaran"}
                    </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-0">
                    {/* Left Column: QR & Amount (Compact) */}
                    <div className="p-5 border-r border-border/50 flex flex-col items-center justify-center text-center space-y-4 bg-muted/5">
                        <div className="space-y-1 flex flex-col items-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Tagihan</p>
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 px-2 rounded-md transition-all group"
                                onClick={() => copyToClipboard((deposit?.totalBayar || amount).toString(), "Total Tagihan")}
                                title="Klik untuk menyalin"
                            >
                                <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                    {formatRupiah(deposit?.totalBayar || amount)}
                                </h2>
                                <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                                {(method.includes('qris') && qrString) ? "QRIS Realtime" : getMethodName(method)}
                            </Badge>
                        </div>

                        {/* QRIS Area Compact */}
                        {isQris && (qrString || qrLink) && (
                            <div className="relative group w-full flex flex-col items-center justify-center">
                                <div className="bg-white p-[6px] rounded-lg border shadow-sm inline-flex items-center justify-center">
                                    {qrString ? (
                                        <div style={{ height: "auto", margin: "0 auto", maxWidth: 160, width: "100%" }}>
                                            <QRCode
                                                size={256}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                value={qrString}
                                                viewBox={`0 0 256 256`}
                                            />
                                        </div>
                                    ) : (
                                        <Image
                                            src={qrLink}
                                            alt="QRIS Code"
                                            width={160}
                                            height={160}
                                            className="rounded-sm"
                                        />
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2">Scan QRIS dengan E-Wallet Anda</p>
                            </div>
                        )}

                        {/* VA Details Compact */}
                        {isVA && nomorVa && (
                            <div className="w-full bg-background border border-border rounded p-3 text-left space-y-2 shadow-sm">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold text-center">Nomor VA {getMethodName(method)}</p>
                                <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded border border-dashed border-primary/20">
                                    <span className="font-mono text-base font-bold flex-1 text-center tracking-wider">{nomorVa}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => copyToClipboard(nomorVa, "Nomor VA")}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Pay Button */}
                        {(isEwallet || (!isQris && !isVA)) && payUrl && (
                            <div className="w-full">
                                <Button size="sm" className="w-full font-bold h-9 text-xs" onClick={() => window.open(payUrl, "_blank")}>
                                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                    Bayar Sekarang
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details (Compact) */}
                    <CardContent className="p-5 space-y-5">

                        {/* Rincian Produk */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold flex items-center gap-2 text-muted-foreground">
                                <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">1</span>
                                Rincian Biaya
                            </h3>
                            <div className="bg-muted/30 rounded border border-border/50 p-3 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{deposit?.itemName || "Top Up Saldo"}</span>
                                    <span className="font-medium">{formatRupiah(deposit?.amount || amount)}</span>
                                </div>
                                {deposit?.adminFee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Biaya Admin</span>
                                        <span className="font-medium">{formatRupiah(deposit?.adminFee || 0)}</span>
                                    </div>
                                )}
                                <Separator className="my-1.5 bg-border/50" />
                                <div className="flex justify-between font-bold">
                                    <span>Total Bayar</span>
                                    <span className="text-primary">{formatRupiah(deposit?.totalBayar || amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Info Pelanggan */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold flex items-center gap-2 text-muted-foreground">
                                <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">2</span>
                                Data Pelanggan
                            </h3>
                            <div className="bg-muted/30 rounded border border-border/50 overflow-hidden text-xs">
                                <div className="flex border-b border-border/50">
                                    <div className="p-2 border-r border-border/50 w-1/2">
                                        <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Nama</p>
                                        <p className="font-medium truncate">{deposit?.customerName || "-"}</p>
                                    </div>
                                    <div className="p-2 w-1/2">
                                        <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Email</p>
                                        <p className="font-medium truncate">{deposit?.customerEmail || "-"}</p>
                                    </div>
                                </div>
                                <div className="p-2 flex justify-between items-center bg-muted/50">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase">ID Transaksi</p>
                                        <p className="font-mono font-medium text-[10px]">{trxId || depositId}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50 hover:opacity-100" onClick={() => copyToClipboard(trxId || depositId, "ID Transaksi")}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Warning Alert Compact */}
                        <div className="flex gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-600 dark:text-amber-400 items-start">
                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            <p className="leading-tight">
                                Selesaikan pembayaran sesuai nominal hingga 3 digit terakhir. Cek otomatis dalam 1-5 menit.
                            </p>
                        </div>
                    </CardContent>
                </div>

                <Separator />
                <CardFooter className="bg-muted/10 p-4 flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => copyToClipboard(window.location.href, "Link pembayaran")}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Salin Link
                    </Button>
                    <Button
                        variant="default"
                        className="w-full sm:w-auto"
                        onClick={checkPaymentStatus}
                        disabled={isChecking || status === "expired"}
                    >
                        {isChecking ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Cek Status Pembayaran
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
