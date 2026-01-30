"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    ArrowUpRight,
    History,
    Wallet,
    Copy,
    Check,
    Clock,
    ArrowRight,
    ArrowLeft,
    QrCode,
    CreditCard,
    CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
// import { getHistory, HistoryItem } from "@/lib/api/history"
// import { getWalletBalance } from "@/lib/api/wallet"
type HistoryItem = any; // Stub definition

// Countdown Timer Component
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft("Expired");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    if (timeLeft === "Expired") {
        return <span className="text-rose-400 text-[9px] font-medium">Expired</span>;
    }

    return (
        <span className="text-[9px] font-mono font-medium flex items-center gap-0.5 mt-px">
            <Clock className="size-2.5" />
            {timeLeft}
        </span>
    );
}

export default function BillingPage() {
    const router = useRouter()
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deposits, setDeposits] = useState<HistoryItem[]>([])
    const [balance, setBalance] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)

    // Top-up State
    const [showTopup, setShowTopup] = useState(false)
    const [step, setStep] = useState(1) // 1: Amount, 2: Method, 3: Summary
    const [amount, setAmount] = useState<string>("")
    const [paymentMethod, setPaymentMethod] = useState("qris")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Stub implementation
                setDeposits([]);
                setBalance(0);
            } catch (error) {
                console.error("Failed to fetch billing data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCopy = (text: string, id: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success(`${label} berhasil disalin`)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const formatRupiah = (num: number) => {
        return `Rp ${num.toLocaleString('id-ID')}`
    }

    const presetAmounts = [20000, 50000, 100000, 200000, 500000, 1000000]

    const handleAmountSelect = (val: number) => {
        setAmount(val.toString())
    }

    const nextStep = () => {
        if (step === 1 && (!amount || parseInt(amount) < 10000)) {
            toast.error("Minimal top up Rp 10.000")
            return
        }
        setStep(step + 1)
    }

    const prevStep = () => {
        setStep(step - 1)
    }

    const handleFinalPay = async () => {
        setIsSubmitting(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        const trxId = `DEP-${Date.now()}`
        router.push(`/payment/${trxId}?amount=${amount}&method=${paymentMethod}&type=deposit`)
    }

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-col space-y-0.5">
                <h1 className="text-lg md:text-xl font-bold tracking-tight">Billing & Top Up</h1>
                <p className="text-muted-foreground text-[10px] md:text-xs">Kelola saldo dan riwayat transaksi deposit Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left Column: Balance & History (or Topup steps) */}
                <div className="md:col-span-2 space-y-4">
                    {!showTopup ? (
                        <>
                            {/* Wallet Balance Card */}
                            <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                                <CardHeader className="bg-muted/20 !p-3 md:!p-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-sm font-bold">Total Saldo</CardTitle>
                                        <CardDescription className="text-[10px]">Saldo saat ini yang tersedia akun Anda.</CardDescription>
                                    </div>
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Wallet className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="text-3xl font-bold tracking-tight text-primary">{formatRupiah(balance)}</div>
                                    <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-md w-fit">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                        Saldo dapat digunakan untuk pembelian produk.
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/10 border-t border-border/50 p-3">
                                    <Button className="w-full font-bold shadow-md shadow-primary/20" onClick={() => setShowTopup(true)}>
                                        <ArrowUpRight className="mr-2 h-4 w-4" /> Top Up Saldo Sekarang
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Deposits History Card */}
                            <Card className="border-border/50 shadow-sm py-0 gap-0">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-bold">Riwayat Deposit</CardTitle>
                                        <CardDescription className="text-xs">
                                            Daftar semua riwayat pengisian saldo deposit Anda.
                                        </CardDescription>
                                    </div>
                                    <History className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Desktop Table */}
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent border-border/50">
                                                    <TableHead className="w-[150px] h-9 text-xs pl-4">ID Transaksi</TableHead>
                                                    <TableHead className="w-[140px] h-9 text-xs">Tanggal</TableHead>
                                                    <TableHead className="h-9 text-xs">Metode</TableHead>
                                                    <TableHead className="h-9 text-xs">Jumlah</TableHead>
                                                    <TableHead className="text-right h-9 text-xs pr-4">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {deposits.map((tx) => (
                                                    <TableRow key={tx.id} className="border-border/50 hover:bg-muted/30">
                                                        <TableCell className="font-medium py-2 text-xs pl-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="truncate max-w-[120px] text-sm" title={tx.id}>{tx.id}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => handleCopy(tx.id, tx.id, "ID Transaksi")}
                                                                >
                                                                    {copiedId === tx.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2 text-xs">{tx.date}</TableCell>
                                                        <TableCell className="py-2 text-xs">{tx.method}</TableCell>
                                                        <TableCell className="py-2 text-xs">{tx.amount}</TableCell>
                                                        <TableCell className="text-right py-2 pr-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {tx.status === "Pending" && (
                                                                    <Button size="sm" className="h-5 px-2 text-[9px] rounded-md gap-1" onClick={() => toast.info("Fitur ini segera hadir!")}>
                                                                        {tx.expiresAt && <CountdownTimer expiresAt={tx.expiresAt} />}
                                                                        {tx.expiresAt && <span className="border-l border-white/30 pl-1">Bayar</span>}
                                                                        {!tx.expiresAt && "Bayar"}
                                                                    </Button>
                                                                )}
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] h-5 px-1.5 font-normal border ${tx.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" :
                                                                        tx.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" :
                                                                            tx.status === "Failed" ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400" :
                                                                                "bg-muted text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {tx.status === "Completed" ? "Selesai" :
                                                                        tx.status === "Pending" ? "Menunggu" :
                                                                            tx.status === "Failed" ? "Gagal" : tx.status}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden grid gap-3 p-3">
                                        {deposits.map((tx) => (
                                            <Card key={tx.id} className="overflow-hidden border-border/50 shadow-sm py-0 gap-0">
                                                <div className="p-3 space-y-3">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <h4 className="font-semibold text-sm leading-tight flex-1">
                                                            {tx.method}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] h-5 px-1.5 font-normal border ${tx.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" :
                                                                    tx.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" :
                                                                        tx.status === "Failed" ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400" :
                                                                            "bg-muted text-muted-foreground"
                                                                    }`}
                                                            >
                                                                {tx.status === "Completed" ? "Selesai" :
                                                                    tx.status === "Pending" ? "Menunggu" :
                                                                        tx.status === "Failed" ? "Gagal" : tx.status}
                                                            </Badge>
                                                            {tx.status === "Pending" && (
                                                                <Button size="sm" className="h-5 px-2 text-[9px] rounded-md gap-1" onClick={() => toast.info("Fitur ini segera hadir!")}>
                                                                    {tx.expiresAt && <CountdownTimer expiresAt={tx.expiresAt} />}
                                                                    {tx.expiresAt && <span className="border-l border-white/30 pl-1">Bayar</span>}
                                                                    {!tx.expiresAt && "Bayar"}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 -mt-1">
                                                        <span className="text-[10px] text-muted-foreground font-mono">{tx.id}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleCopy(tx.id, `mobile-${tx.id}`, "ID Transaksi")}
                                                        >
                                                            {copiedId === `mobile-${tx.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-end justify-between pt-1">
                                                        <span className="text-[10px] text-muted-foreground text-xs">{tx.date}</span>
                                                        <span className="font-bold text-sm">{tx.amount}</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        /* TOPUP FLOW */
                        <div className="space-y-4">
                            <Button variant="ghost" size="sm" className="h-8 text-xs -ml-2 text-muted-foreground hover:text-foreground" onClick={() => { setShowTopup(false); setStep(1); }}>
                                <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Kembali Ke Saldo
                            </Button>

                            {/* Step Indicator */}
                            <div className="flex items-center justify-between mb-2">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex flex-1 items-center last:flex-none">
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === s ? 'bg-primary border-primary text-white' : step > s ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-muted border-border text-muted-foreground'}`}>
                                            {step > s ? <Check className="h-3 w-3" /> : s}
                                        </div>
                                        {s < 3 && <div className={`h-0.5 flex-1 mx-2 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-muted'}`} />}
                                    </div>
                                ))}
                            </div>

                            {step === 1 && (
                                <Card className="border-border/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <CardHeader className="bg-muted/20 border-b border-border/50 !p-4">
                                        <CardTitle className="text-sm font-bold">Langkah 1: Tentukan Nominal</CardTitle>
                                        <CardDescription className="text-xs">Pilih nominal top up atau masukkan nominal kustom.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {presetAmounts.map((preset) => (
                                                <Button
                                                    key={preset}
                                                    variant={amount === preset.toString() ? "default" : "outline"}
                                                    className={`h-10 text-xs font-bold ${amount === preset.toString() ? "ring-2 ring-primary/20" : "border-border/50"}`}
                                                    onClick={() => handleAmountSelect(preset)}
                                                >
                                                    {formatRupiah(preset)}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="custom-amount" className="text-xs">Nominal Kustom (Min Rp 10.000)</Label>
                                            <div className="relative">
                                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="custom-amount"
                                                    type="number"
                                                    placeholder="Masukkan nominal lainnya..."
                                                    className="pl-9 h-11 text-sm font-bold"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/10 border-t border-border/50 p-4">
                                        <Button className="w-full font-bold h-10 shadow-md shadow-primary/20" onClick={nextStep}>
                                            Lanjut Pilih Pembayaran <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}

                            {step === 2 && (
                                <Card className="border-border/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
                                    <CardHeader className="bg-muted/20 border-b border-border/50 !p-4">
                                        <CardTitle className="text-sm font-bold">Langkah 2: Metode Pembayaran</CardTitle>
                                        <CardDescription className="text-xs">Pilih metode pembayaran yang paling mudah bagi Anda.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-1 gap-2">
                                            <Button
                                                variant={paymentMethod === "qris" ? "default" : "outline"}
                                                className={`h-auto py-3 justify-start px-4 gap-3 ${paymentMethod === "qris" ? "ring-2 ring-primary/20" : "border-border/50"}`}
                                                onClick={() => setPaymentMethod("qris")}
                                            >
                                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${paymentMethod === "qris" ? "bg-white/20" : "bg-muted"}`}>
                                                    <QrCode className="h-5 w-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm">QRIS (Gopay, OVO, ShopeePay, Dana)</p>
                                                    <p className="text-[10px] opacity-80">Scan & Konfirmasi Otomatis</p>
                                                </div>
                                            </Button>
                                            <Button
                                                variant={paymentMethod === "va" ? "default" : "outline"}
                                                className={`h-auto py-3 justify-start px-4 gap-3 ${paymentMethod === "va" ? "ring-2 ring-primary/20" : "border-border/50"}`}
                                                onClick={() => setPaymentMethod("va")}
                                            >
                                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${paymentMethod === "va" ? "bg-white/20" : "bg-muted"}`}>
                                                    <CreditCard className="h-5 w-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm">Virtual Account (BCA, Mandiri, BNI)</p>
                                                    <p className="text-[10px] opacity-80">Transfer Bank & Konfirmasi Otomatis</p>
                                                </div>
                                            </Button>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/10 border-t border-border/50 p-4 flex gap-3">
                                        <Button variant="outline" className="h-10 text-xs px-4" onClick={prevStep}>Kembali</Button>
                                        <Button className="flex-1 font-bold h-10 shadow-md shadow-primary/20" onClick={nextStep}>
                                            Tinjau Pesanan <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}

                            {step === 3 && (
                                <Card className="border-border/50 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                    <CardHeader className="bg-muted/20 border-b border-border/50 !p-4">
                                        <CardTitle className="text-sm font-bold">Langkah 3: Konfirmasi Top Up</CardTitle>
                                        <CardDescription className="text-xs">Pastikan detail pesanan Anda sudah benar.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <div className="bg-muted/20 rounded-xl p-4 border border-border/50 space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Jenis Transaksi</span>
                                                <span className="font-bold text-primary">Top Up Saldo</span>
                                            </div>
                                            <Separator className="bg-border/50" />
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Nominal Top Up</span>
                                                <span className="font-bold">{formatRupiah(parseInt(amount))}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Metode Pembayaran</span>
                                                <span className="font-bold uppercase">{paymentMethod}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Biaya Layanan</span>
                                                <span className="font-bold text-emerald-500">Gratis</span>
                                            </div>
                                            <Separator className="bg-border/50" />
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="font-bold text-sm">Total Bayar</span>
                                                <span className="font-bold text-xl text-primary">{formatRupiah(parseInt(amount))}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                            <p className="text-[10px] md:text-xs text-muted-foreground">Saldo akan langsung masuk ke akun setelah pembayaran dikonfirmasi.</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/10 border-t border-border/50 p-4 flex gap-3">
                                        <Button variant="outline" className="h-10 text-xs px-4" onClick={prevStep}>Kembali</Button>
                                        <Button
                                            className="flex-1 font-bold h-10 shadow-md shadow-primary/20"
                                            disabled={isSubmitting}
                                            onClick={handleFinalPay}
                                        >
                                            {isSubmitting ? "Memproses..." : "Bayar Sekarang"} <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Tips & Info (Only show when not in topup summary/method?) */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm p-0 gap-0 overflow-hidden">
                        <CardHeader className="bg-muted/20 !p-3 md:!p-4 border-b border-border/50 flex flex-row items-center gap-2 space-y-0">
                            <CardTitle className="text-xs md:text-sm font-bold">Butuh Bantuan?</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 md:p-4 space-y-3">
                            <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                                Jika Anda mengalami kendala saat melakukan top up saldo atau konfirmasi pembayaran, silakan hubungi tim support kami.
                            </p>
                        </CardContent>
                        <CardFooter className="p-3 md:p-4 pt-0">
                            <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => router.push("/support")}>
                                Hubungi Support
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm p-0 gap-0 overflow-hidden border-primary/20">
                        <CardHeader className="bg-primary/5 !p-3 md:!p-4 border-b border-border/50 flex flex-row items-center gap-2 space-y-0">
                            <CardTitle className="text-xs md:text-sm text-primary font-bold flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                Jam Operasional
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 md:p-4 space-y-3">
                            <ul className="space-y-1.5">
                                <li className="flex justify-between text-[10px] md:text-xs">
                                    <span className="text-muted-foreground">Senin - Jumat</span>
                                    <span className="font-medium">08:00 - 22:00</span>
                                </li>
                                <li className="flex justify-between text-[10px] md:text-xs">
                                    <span className="text-muted-foreground">Sabtu - Minggu</span>
                                    <span className="font-medium">10:00 - 18:00</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
