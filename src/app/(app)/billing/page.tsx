"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
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
import { getWalletBalance, createTopUp } from "@/lib/actions/wallet"
import type { TokopayChannelKey } from "@/lib/tokopay-constants"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

interface HistoryItem {
    id: string
    depositId?: number
    date: string
    method: string
    amount: string
    totalBayar?: number
    status: string
    expiresAt?: number
    payUrl?: string
    qrLink?: string
    qrString?: string
}

// Payment Methods Data
const PAYMENT_METHODS = [
    // QRIS
    { id: "qris", name: "QRIS", fee: "Rp100+0.70%", category: "qris", img: "https://assets.tokovoucher.id/2023/04/915e406841cd333f12e6cd2d29c59723.png" },
    { id: "qris_realtime", name: "QRIS Realtime", fee: "1.70%", category: "qris", img: "https://assets.tokovoucher.id/2023/04/915e406841cd333f12e6cd2d29c59723.png" },
    // E-Wallet
    { id: "shopeepay", name: "ShopeePay", fee: "2.50%", category: "ewallet", img: "https://assets.tokovoucher.id/2022/11/9a8849fb68683ccaed7483d827d07b39.png" },
    { id: "gopay", name: "GoPay", fee: "3.00%", category: "ewallet", img: "https://assets.tokovoucher.id/2023/04/64fb349fefc6ce687700ea8724a37d19.png" },
    { id: "dana", name: "DANA", fee: "2.50%", category: "ewallet", img: "https://assets.tokovoucher.id/2022/11/39dfa0a150297717e71239f0cd215f75.png" },
    { id: "ovo", name: "OVO", fee: "2.50%", category: "ewallet", img: "https://js.durianpay.id/assets/img_ovo.svg" },
    { id: "linkaja", name: "LinkAja", fee: "3.00%", category: "ewallet", img: "https://assets.tokovoucher.id/2022/11/b951de09eee40c57a3b570ecf396f119.png" },
    { id: "astrapay", name: "AstraPay", fee: "2.50%", category: "ewallet", img: "https://astrapay.com/static-assets/images/logos/logo-colorful.png" },
    { id: "virgo", name: "Virgo", fee: "2.00%", category: "ewallet", img: "https://cdn.tokovoucher.id/2023/09/afc0069f7ab599da7a1f4980990d3211.png" },
    { id: "dana_realtime", name: "DANA R", fee: "3.20%", category: "ewallet", img: "https://assets.tokovoucher.id/2022/11/39dfa0a150297717e71239f0cd215f75.png" },
    // Virtual Account
    { id: "bri", name: "BRI VA", fee: "Rp3.000", category: "va", img: "https://assets.tokovoucher.id/2022/11/065303bb0d98a0e72292e93b90045d18.png" },
    { id: "bca", name: "BCA VA", fee: "Rp4.200", category: "va", img: "https://assets.tokovoucher.id/2022/11/f16b7a44e94da7632dfc672b6dbcf525.png" },
    { id: "bni", name: "BNI VA", fee: "Rp3.500", category: "va", img: "https://assets.tokovoucher.id/2022/11/ce2ecb5af35f8ed39f3e3eced974a70c.png" },
    { id: "mandiri", name: "Mandiri VA", fee: "Rp3.500", category: "va", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/2560px-Bank_Mandiri_logo_2016.svg.png" },
    { id: "permata", name: "Permata VA", fee: "Rp2.000", category: "va", img: "https://upload.wikimedia.org/wikipedia/id/4/48/PermataBank_logo.svg" },
    { id: "cimb", name: "CIMB VA", fee: "Rp2.500", category: "va", img: "https://assets.tokovoucher.id/2023/05/f7dd3b47f32b2ce56dec828255b4ba7a.png" },
    { id: "danamon", name: "Danamon VA", fee: "Rp2.500", category: "va", img: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Danamon.svg" },
    { id: "bsi", name: "BSI VA", fee: "Rp3.500", category: "va", img: "https://assets.pikiran-rakyat.com/crop/0x0:0x0/x/photo/2021/09/19/833815890.jpg" },
    // Retail
    { id: "alfamart", name: "Alfamart", fee: "Rp3.000", category: "retail", img: "https://assets.tokovoucher.id/2022/11/0932396b5975cc0bd27a885539283b51.png" },
    { id: "indomaret", name: "Indomaret", fee: "Rp3.000", category: "retail", img: "https://assets.tokovoucher.id/2022/12/5ad59de08cb178e08ff5a33449755e76.png" },
]

const presetAmounts = [10000, 20000, 50000, 100000, 200000, 500000]

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function CountdownTimer({ expiresAt }: { expiresAt: number }) {
    const [timeLeft, setTimeLeft] = useState<string>("")

    useEffect(() => {
        const updateTimer = () => {
            const now = Date.now()
            const diff = expiresAt - now

            if (diff <= 0) {
                setTimeLeft("Expired")
                return
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft(`${minutes}m ${seconds}s`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [expiresAt])

    return <span className="font-mono">{timeLeft}</span>
}

export default function BillingPage() {
    const router = useRouter()
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deposits, setDeposits] = useState<HistoryItem[]>([])
    const [balance, setBalance] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)

    const [showTopup, setShowTopup] = useState(false)
    const [step, setStep] = useState(1)
    const [amount, setAmount] = useState<string>("50000")
    const [paymentMethod, setPaymentMethod] = useState<string>("qris")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const totalPages = Math.ceil(deposits.length / itemsPerPage)

    const currentDeposits = deposits.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    useEffect(() => {
        const fetchData = async () => {

            setIsLoading(true);
            try {
                // Fetch Balance

                const balanceRes = await getWalletBalance();


                if (balanceRes.success && balanceRes.data) {
                    setBalance(parseFloat(balanceRes.data.balance));
                } else {
                    console.error("BillingPage: Failed to get balance:", balanceRes.error)
                }

                // Fetch Deposits from history
                const { getHistory } = await import("@/lib/actions/history");
                const historyRes = await getHistory();
                if (historyRes.success && historyRes.data) {
                    setDeposits(historyRes.data.deposits.map((d: any) => ({
                        id: d.id,
                        depositId: d.depositId,
                        date: d.date,
                        method: d.method,
                        amount: d.amount,
                        totalBayar: d.totalBayar,
                        status: d.status,
                        payUrl: d.payUrl,
                        qrLink: d.qrLink,
                        qrString: d.qrString,
                    })));
                }
            } catch (error) {
                console.error("BillingPage: Error fetching billing data:", error);
                toast.error("Gagal memuat informasi saldo");
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

    const handleAmountSelect = (value: number) => {
        setAmount(value.toString())
    }

    const handlePayDeposit = (tx: HistoryItem) => {
        if (!tx.id) {
            toast.error("Data deposit tidak lengkap")
            return
        }

        // Use visible ID (trxId or DEP-...) from history item
        router.push(`/payment/${tx.id}`)
    }

    const nextStep = () => {
        if (step === 1 && (!amount || parseInt(amount) < 1000)) {
            toast.error("Minimal top up Rp 1.000")
            return
        }
        setStep(step + 1)
    }

    const prevStep = () => {
        setStep(step - 1)
    }

    const handleFinalPay = async () => {
        setIsSubmitting(true)
        try {
            const result = await createTopUp({
                amount: parseInt(amount),
                paymentMethod: paymentMethod as TokopayChannelKey,
            })

            if (!result.success || !result.data) {
                toast.error(result.error || "Gagal membuat pesanan")
                setIsSubmitting(false)
                return
            }

            toast.success("Pesanan top up berhasil dibuat!")

            // Reset form and close modal
            setShowTopup(false)
            setStep(1)
            setAmount("50000")
            setPaymentMethod("qris")

            // Redirect to payment page (with clean Transaction ID URL)
            // Use trxId (from Tokopay) or refId (our generated ID)
            const identifier = result.data.trxId || result.data.refId || result.data.depositId
            router.push(`/payment/${identifier}`)
        } catch (error) {
            console.error("Error creating top up:", error)
            toast.error("Terjadi kesalahan saat memproses top up")
        } finally {
            setIsSubmitting(false)
        }
    }



    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="bg-muted/30 p-4 rounded-full">
                <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
                <h3 className="font-medium text-base">Belum ada riwayat deposit</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Anda belum melakukan pengisian saldo deposit.
                </p>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col space-y-0.5">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-3 w-64 mt-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                        <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-muted/20 !p-3 md:!p-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                                <div className="space-y-0.5">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-2 w-48 mt-1" />
                                </div>
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Skeleton className="h-8 w-40" />
                                <Skeleton className="h-6 w-56 mt-2 rounded-md" />
                            </CardContent>
                            <CardFooter className="bg-muted/10 border-t border-border/50 p-3">
                                <Skeleton className="h-9 w-full rounded-md" />
                            </CardFooter>
                        </Card>

                        <Card className="border-border/50 shadow-sm py-0 gap-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-56" />
                                </div>
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="hidden md:block">
                                    <div className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent border-border/50">
                                                    <TableHead className="w-[150px] h-9 text-xs pl-4"><Skeleton className="h-4 w-20" /></TableHead>
                                                    <TableHead className="w-[140px] h-9 text-xs"><Skeleton className="h-4 w-24" /></TableHead>
                                                    <TableHead className="h-9 text-xs"><Skeleton className="h-4 w-16" /></TableHead>
                                                    <TableHead className="h-9 text-xs"><Skeleton className="h-4 w-20" /></TableHead>
                                                    <TableHead className="text-right h-9 text-xs pr-4"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {[...Array(5)].map((_, i) => (
                                                    <TableRow key={i} className="border-border/50 hover:bg-transparent">
                                                        <TableCell className="py-3 pl-4"><Skeleton className="h-4 w-24" /></TableCell>
                                                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                                                        <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                                                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                                                        <TableCell className="py-3 pr-4 flex justify-end"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                                <div className="md:hidden grid gap-3 p-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Card key={i} className="overflow-hidden border-border/50 shadow-sm py-0 gap-0">
                                            <div className="p-3 space-y-3">
                                                <div className="flex justify-between items-start gap-3">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-5 w-16 rounded-full" />
                                                </div>
                                                <div className="flex items-center gap-1.5 -mt-1">
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                                <div className="flex items-end justify-between pt-1">
                                                    <Skeleton className="h-3 w-16" />
                                                    <Skeleton className="h-4 w-20" />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1 space-y-4">
                        <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm p-0 gap-0 overflow-hidden">
                            <CardHeader className="bg-muted/20 !p-3 md:!p-4 border-b border-border/50">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent className="p-3 md:p-4 space-y-3">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </CardContent>
                            <CardFooter className="p-3 md:p-4 pt-0">
                                <Skeleton className="h-8 w-full" />
                            </CardFooter>
                        </Card>

                        <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm p-0 gap-0 overflow-hidden">
                            <CardHeader className="bg-primary/5 !p-3 md:!p-4 border-b border-border/50">
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent className="p-3 md:p-4 space-y-3">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
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
                                                {currentDeposits.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-24">
                                                            <EmptyState />
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    currentDeposits.map((tx) => (
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
                                                                        <Button size="sm" className="h-5 px-2 text-[9px] rounded-md gap-1" onClick={() => handlePayDeposit(tx)}>
                                                                            {tx.expiresAt ? <CountdownTimer expiresAt={tx.expiresAt} /> : null}
                                                                            {tx.expiresAt ? <span className="border-l border-white/30 pl-1">Bayar</span> : "Bayar"}
                                                                        </Button>
                                                                    )}
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-[10px] h-5 px-1.5 font-normal border ${tx.status === "Success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" :
                                                                            tx.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" :
                                                                                tx.status === "Failed" || tx.status === "Expired" ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400" :
                                                                                    "bg-muted text-muted-foreground"
                                                                            }`}
                                                                    >
                                                                        {tx.status === "Success" ? "Success" :
                                                                            tx.status === "Pending" ? "Pending" :
                                                                                tx.status === "Failed" ? "Failed" :
                                                                                    tx.status === "Expired" ? "Expired" : tx.status}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden grid gap-3 p-3">
                                        {currentDeposits.length === 0 ? (
                                            <EmptyState />
                                        ) : (
                                            currentDeposits.map((tx) => (
                                                <Card key={tx.id} className="overflow-hidden border-border/50 shadow-sm py-0 gap-0">
                                                    <div className="p-3 space-y-3">
                                                        <div className="flex justify-between items-start gap-3">
                                                            <h4 className="font-semibold text-sm leading-tight flex-1">
                                                                {tx.method}
                                                            </h4>
                                                            <div className="flex items-center gap-1.5">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] h-5 px-1.5 font-normal border ${tx.status === "Success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" :
                                                                        tx.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" :
                                                                            tx.status === "Failed" || tx.status === "Expired" ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400" :
                                                                                "bg-muted text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {tx.status === "Success" ? "Berhasil" :
                                                                        tx.status === "Pending" ? "Menunggu" :
                                                                            tx.status === "Failed" ? "Gagal" :
                                                                                tx.status === "Expired" ? "Kadaluarsa" : tx.status}
                                                                </Badge>
                                                                {tx.status === "Pending" && (
                                                                    <Button size="sm" className="h-5 px-2 text-[9px] rounded-md gap-1" onClick={() => handlePayDeposit(tx)}>
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
                                            ))
                                        )}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="py-4 border-t border-border/50">
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (currentPage > 1) setCurrentPage(c => c - 1);
                                                            }}
                                                            className={currentPage === 1 ? "pointer-events-none opacity-50 text-xs h-8" : "text-xs h-8 cursor-pointer"}
                                                        />
                                                    </PaginationItem>

                                                    {/* Page Numbers */}
                                                    {[...Array(totalPages)].map((_, i) => {
                                                        const p = i + 1;
                                                        if (
                                                            totalPages <= 5 ||
                                                            p === 1 ||
                                                            p === totalPages ||
                                                            (p >= currentPage - 1 && p <= currentPage + 1)
                                                        ) {
                                                            return (
                                                                <PaginationItem key={p}>
                                                                    <PaginationLink
                                                                        href="#"
                                                                        isActive={currentPage === p}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setCurrentPage(p);
                                                                        }}
                                                                        className="text-xs h-8 w-8 cursor-pointer"
                                                                    >
                                                                        {p}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            );
                                                        }

                                                        if (
                                                            (p === currentPage - 2 && p > 1) ||
                                                            (p === currentPage + 2 && p < totalPages)
                                                        ) {
                                                            return <PaginationItem key={p}><PaginationEllipsis className="h-4 w-4" /></PaginationItem>;
                                                        }

                                                        return null;
                                                    })}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (currentPage < totalPages) setCurrentPage(c => c + 1);
                                                            }}
                                                            className={currentPage === totalPages ? "pointer-events-none opacity-50 text-xs h-8" : "text-xs h-8 cursor-pointer"}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </div>
                                    )}
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
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === s ? 'bg-primary border-primary text-primary-foreground' : step > s ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-muted border-border text-muted-foreground'}`}>
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
                                    <CardContent className="p-4 space-y-4">
                                        {/* QRIS */}
                                        <div>
                                            <h3 className="text-xs font-bold mb-2 text-muted-foreground">QRIS</h3>
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                {PAYMENT_METHODS.filter(p => p.category === "qris").map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setPaymentMethod(item.id)}
                                                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/50 hover:border-border hover:bg-muted/30"}`}
                                                    >
                                                        <img src={item.img} alt={item.name} className="h-6 w-auto object-contain mb-1" />
                                                        <span className="text-[9px] font-medium text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* E-Wallet */}
                                        <div>
                                            <h3 className="text-xs font-bold mb-2 text-muted-foreground">E-Wallet</h3>
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                {PAYMENT_METHODS.filter(p => p.category === "ewallet").map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setPaymentMethod(item.id)}
                                                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/50 hover:border-border hover:bg-muted/30"}`}
                                                    >
                                                        <img src={item.img} alt={item.name} className="h-6 w-auto object-contain mb-1" />
                                                        <span className="text-[9px] font-medium text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Virtual Account */}
                                        <div>
                                            <h3 className="text-xs font-bold mb-2 text-muted-foreground">Virtual Account</h3>
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                {PAYMENT_METHODS.filter(p => p.category === "va").map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setPaymentMethod(item.id)}
                                                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/50 hover:border-border hover:bg-muted/30"}`}
                                                    >
                                                        <img src={item.img} alt={item.name} className="h-6 w-auto object-contain mb-1" />
                                                        <span className="text-[9px] font-medium text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Retail */}
                                        <div>
                                            <h3 className="text-xs font-bold mb-2 text-muted-foreground">Retail</h3>
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                {PAYMENT_METHODS.filter(p => p.category === "retail").map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setPaymentMethod(item.id)}
                                                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${paymentMethod === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/50 hover:border-border hover:bg-muted/30"}`}
                                                    >
                                                        <img src={item.img} alt={item.name} className="h-6 w-auto object-contain mb-1" />
                                                        <span className="text-[9px] font-medium text-center leading-tight">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
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
                                                <span className="font-bold">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.name || paymentMethod.toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Biaya Admin</span>
                                                <span className="font-bold text-amber-500">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.fee || "Gratis"}</span>
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
