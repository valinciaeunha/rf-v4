"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import { Copy, Clock, CheckCircle2, QrCode, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function PaymentPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const trxId = params.id as string
    const amount = parseInt(searchParams.get("amount") || "0")
    const method = searchParams.get("method") || "qris"

    const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
    const [status, setStatus] = useState<"pending" | "success" | "expired">("pending")

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setStatus("expired")
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Mock payment check polling
        const checker = setInterval(() => {
            // Randomly succeed after 10-20 seconds for demo
            if (Math.random() > 0.95 && status === "pending") {
                // setStatus("success") // Uncomment to auto-succeed in demo
            }
        }, 3000)

        return () => {
            clearInterval(timer)
            clearInterval(checker)
        }
    }, [status])

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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert("Disalin!")
    }

    if (status === "success") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-4">
                <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-green-500">Pembayaran Berhasil!</h1>
                <p className="text-muted-foreground max-w-md">
                    Terima kasih. Akses Cloud Phone Anda sedang diproses dan detailnya telah dikirim ke email/WhatsApp Anda.
                </p>
                <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => router.push("/dashboard")}>Ke Dashboard</Button>
                    <Button onClick={() => window.open("https://wa.me/628123456789", "_blank")}>Hubungi Admin</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
            <Card className="max-w-sm w-full border-border/50 shadow-2xl relative overflow-hidden bg-card/60 backdrop-blur-sm">
                {/* Status Bar */}
                <div className="bg-muted/30 p-3 flex justify-between items-center border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span className="font-mono font-bold text-primary text-sm">{formatTime(timeLeft)}</span>
                    </div>
                    <Badge variant={status === "expired" ? "destructive" : "outline"} className="uppercase text-[10px] h-5">
                        {status === "expired" ? "Kedaluwarsa" : "Menunggu Pembayaran"}
                    </Badge>
                </div>

                <CardContent className="pt-6 flex flex-col items-center text-center space-y-5 p-5">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Tagihan</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{formatRupiah(amount)}</h2>
                    </div>

                    {method === "qris" ? (
                        <div className="relative group">
                            <div className="bg-white p-3 rounded-xl border shadow-sm">
                                {/* Placeholder QRIS */}
                                <div className="h-40 w-40 bg-black flex items-center justify-center rounded-lg">
                                    <QrCode className="h-24 w-24 text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">Scan QRIS menggunakan E-Wallet pilihan Anda</p>
                        </div>
                    ) : (
                        <div className="w-full bg-muted/30 p-3 rounded-lg space-y-3 text-left border border-border/30">
                            <div>
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase">Bank Virtual Account</p>
                                <p className="font-bold text-sm">BCA</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase">Nomor VA</p>
                                <div className="flex justify-between items-center bg-background border border-border/50 p-1.5 px-3 rounded text-sm">
                                    <span className="font-mono font-bold tracking-wider">880123456789</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => copyToClipboard("880123456789")}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="py-2.5 px-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 flex items-start">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="ml-2">
                            <h5 className="text-xs font-bold text-amber-500 text-left">Penting</h5>
                            <p className="text-[10px] text-left text-muted-foreground leading-tight">
                                Selesaikan pembayaran sebelum waktu habis.
                            </p>
                        </div>
                    </div>

                    <div className="w-full pt-2">
                        <Separator className="mb-2 bg-border/50" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>ID Transaksi</span>
                            <span className="font-mono text-[10px]">{trxId}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="bg-muted/10 p-4 pt-2">
                    <Button
                        variant="outline"
                        className="w-full h-8 text-xs font-bold"
                        onClick={() => setStatus("success")}
                    >
                        Check Status (Demo)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
