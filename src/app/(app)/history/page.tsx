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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { History, Package, Wallet, Copy, Check, Eye, Clock } from "lucide-react"
// import Link from "next/link"
import { toast } from "sonner"
// import { getHistory, HistoryItem } from "@/lib/api/history"
// type HistoryItem = any; // Stub definition
interface BaseItem {
    id: string;
    date: string;
    amount: string;
    status: string;
}

interface ProductPurchase extends BaseItem {
    product: string;
    code?: string | string[];
    expiresAt?: string;
}

interface DepositHistory extends BaseItem {
    method: string;
    expiresAt?: string;
}

type HistoryItem = ProductPurchase | DepositHistory;

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

import { getHistory } from "@/lib/actions/history";
import { Skeleton } from "@/components/ui/skeleton";


// ... existing imports

export default function HistoryPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"products" | "deposits">("products")
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [historyData, setHistoryData] = useState<{ products: ProductPurchase[], deposits: DepositHistory[] }>({ products: [], deposits: [] })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await getHistory();
                if (result.success && result.data) {
                    setHistoryData(result.data as any); // Type cast as API returns simplified type
                } else {
                    console.error("Failed to fetch history:", result.error);
                    toast.error("Gagal memuat riwayat transaksi");
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
                toast.error("Gagal memuat riwayat transaksi");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCopy = async (text: string, id: string, label: string) => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text)
            } else {
                // Fallback for non-secure contexts (HTTP)
                const textArea = document.createElement('textarea')
                textArea.value = text
                textArea.style.position = 'fixed'
                textArea.style.left = '-9999px'
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
            }
            setCopiedId(id)
            toast.success(`${label} berhasil disalin`)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (error) {
            toast.error('Gagal menyalin ke clipboard')
        }
    }

    const renderCodeCell = (item: HistoryItem) => {
        if (!("code" in item)) return null;

        // Only show code for Success status
        if (item.status !== "Success") {
            return <span className="text-muted-foreground text-xs">-</span>;
        }

        // Handle null/undefined/empty code
        if (!item.code || (Array.isArray(item.code) && item.code.length === 0)) {
            return <span className="text-muted-foreground text-xs">-</span>;
        }

        const isBulk = Array.isArray(item.code);

        if (isBulk) {
            const codes = item.code as string[];
            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full max-w-[140px]">
                            <Eye className="h-3.5 w-3.5" />
                            {codes.length} Kode
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Kode Produk</DialogTitle>
                            <DialogDescription>
                                Daftar {codes.length} kode dari transaksi {item.id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
                            {codes.map((code, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded border bg-muted/30 text-xs font-mono">
                                    <span className="truncate mr-2">{code}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() => handleCopy(code, `code-${item.id}-${idx}`, "Kode Produk")}
                                    >
                                        {copiedId === `code-${item.id}-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2">
                            <Button
                                className="w-full"
                                onClick={() => handleCopy(codes.join("\n"), `bulk-all-${item.id}`, "Semua Kode")}
                            >
                                {copiedId === `bulk-all-${item.id}` ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                Salin Semua ({codes.length})
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            );
        }

        return (
            <div className="flex items-center gap-2 max-w-[200px]">
                <code className="bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 font-mono text-[10px] truncate flex-1">
                    {item.code}
                </code>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(String(item.code), `code-${item.id}`, "Kode Produk")}
                >
                    {copiedId === `code-${item.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
            </div>
        );
    }

    const currentData = activeTab === "products" ? historyData.products : historyData.deposits;
    const isEmpty = !isLoading && currentData.length === 0;

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="bg-muted/30 p-4 rounded-full">
                {activeTab === "products" ? (
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                ) : (
                    <Wallet className="h-8 w-8 text-muted-foreground/50" />
                )}
            </div>
            <div className="space-y-1">
                <h3 className="font-medium text-base">Belum ada riwayat {activeTab === "products" ? "pembelian" : "deposit"}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {activeTab === "products"
                        ? "Anda belum melakukan pembelian produk apapun."
                        : "Anda belum melakukan pengisian saldo deposit."}
                </p>
            </div>
        </div>
    );

    const SkeletonRow = () => (
        <TableRow className="border-border/50 hover:bg-transparent">
            <TableCell className="py-3 pl-4"><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
            {activeTab === "products" && (
                <TableCell className="py-3"><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
            )}
            <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="py-3 pr-4 flex justify-end"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
        </TableRow>
    );

    const SkeletonCard = () => (
        <Card className="overflow-hidden border-border/50 shadow-sm py-0 gap-0">
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
    );


    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto w-full">
            <div className="flex items-center space-x-2">
                <Button
                    variant={activeTab === "products" ? "default" : "outline"}
                    onClick={() => setActiveTab("products")}
                    size="sm"
                    className="gap-2 h-8 text-xs"
                >
                    <Package className="h-3.5 w-3.5" />
                    Produk
                </Button>
                <Button
                    variant={activeTab === "deposits" ? "default" : "outline"}
                    onClick={() => setActiveTab("deposits")}
                    size="sm"
                    className="gap-2 h-8 text-xs"
                >
                    <Wallet className="h-3.5 w-3.5" />
                    Deposit
                </Button>
            </div>

            <Card className="border-border/50 shadow-sm py-0 gap-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                            {activeTab === "products" ? "Riwayat Pembelian Produk" : "Riwayat Deposit"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {activeTab === "products"
                                ? "Daftar semua pembelian produk yang pernah Anda lakukan."
                                : "Daftar semua riwayat pengisian saldo deposit Anda."}
                        </CardDescription>
                    </div>
                    {activeTab === "products" ? (
                        <Package className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <History className="h-4 w-4 text-muted-foreground" />
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="w-[150px] h-9 text-xs pl-4">ID Transaksi</TableHead>
                                    <TableHead className="w-[140px] h-9 text-xs">Tanggal</TableHead>
                                    <TableHead className="h-9 text-xs">{activeTab === "products" ? "Produk" : "Metode"}</TableHead>
                                    {activeTab === "products" && (
                                        <TableHead className="h-9 text-xs w-[180px]">Kode Voucher</TableHead>
                                    )}
                                    <TableHead className="h-9 text-xs">Jumlah</TableHead>
                                    <TableHead className="text-right h-9 text-xs pr-4">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                                ) : isEmpty ? (
                                    <TableRow>
                                        <TableCell colSpan={activeTab === "products" ? 6 : 5} className="h-24">
                                            <EmptyState />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentData.map((item) => (
                                        <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                                            <TableCell className="font-medium py-2 text-xs pl-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="truncate max-w-[120px] text-sm" title={item.id}>{item.id}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleCopy(item.id, item.id, "ID Transaksi")}
                                                    >
                                                        {copiedId === item.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-xs">{item.date}</TableCell>
                                            <TableCell className="py-2 text-xs">
                                                <span className="line-clamp-1" title={"product" in item ? item.product : item.method}>
                                                    {"product" in item ? item.product : item.method}
                                                </span>
                                            </TableCell>
                                            {activeTab === "products" && (
                                                <TableCell className="py-2 text-xs">
                                                    {renderCodeCell(item)}
                                                </TableCell>
                                            )}
                                            <TableCell className="py-2 text-xs">{item.amount}</TableCell>
                                            <TableCell className="text-right py-2 pr-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] h-5 px-1.5 font-normal border ${item.status === "Success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" :
                                                        item.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" :
                                                            item.status === "Refund" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400" :
                                                                item.status === "Failed" || item.status === "Expired" ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400" : ""
                                                        }`}
                                                >
                                                    {item.status}
                                                </Badge>
                                                {item.status === "Pending" && "expiresAt" in item && (
                                                    <Button size="sm" className="ml-2 h-5 px-2 text-[9px] rounded-md gap-1" onClick={() => router.push(`/payment/${item.id}`)}>
                                                        <CountdownTimer expiresAt={item.expiresAt as string} />
                                                        <span className="border-l border-white/30 pl-1">Bayar</span>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden grid gap-3 p-3">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
                        ) : isEmpty ? (
                            <EmptyState />
                        ) : (
                            currentData.map((item) => (
                                <Card key={item.id} className="overflow-hidden border-border/50 shadow-sm py-0 gap-0">
                                    <div className="p-3 space-y-3">
                                        {/* Top Row: Product Name (Left) & Status (Right) */}
                                        <div className="flex justify-between items-start gap-3">
                                            <h4 className="font-semibold text-sm leading-tight flex-1">
                                                {"product" in item ? item.product : item.method}
                                            </h4>
                                            <div className="flex items-center gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] h-5 px-1.5 font-normal border ${item.status === "Success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" :
                                                        item.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" :
                                                            item.status === "Refund" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400" :
                                                                item.status === "Failed" || item.status === "Expired" ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400" : ""
                                                        }`}
                                                >
                                                    {item.status}
                                                </Badge>
                                                {item.status === "Pending" && "expiresAt" in item && (
                                                    <Button size="sm" className="h-5 px-2 text-[9px] rounded-md gap-1" onClick={() => router.push(`/payment/${item.id}`)}>
                                                        <CountdownTimer expiresAt={item.expiresAt as string} />
                                                        <span className="border-l border-white/30 pl-1">Bayar</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* ID Row: Below Name, Copyable */}
                                        <div className="flex items-center gap-1.5 -mt-1">
                                            <span className="text-[10px] text-muted-foreground font-mono">{item.id}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleCopy(item.id, `mobile-${item.id}`, "ID Transaksi")}
                                            >
                                                {copiedId === `mobile-${item.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            </Button>
                                        </div>

                                        {/* Bottom Info: Date/Time (Left) & Price (Right) */}
                                        <div className="flex items-end justify-between pt-1">
                                            <span className="text-[10px] text-muted-foreground text-xs">{item.date}</span>
                                            <span className="font-bold text-sm">{item.amount}</span>
                                        </div>

                                        {/* Very Bottom: Product Code (Only for products with Success status) */}
                                        {"code" in item && item.status === "Success" && (
                                            <div className="pt-2 mt-1 border-t border-border/50">
                                                <p className="text-[10px] text-muted-foreground mb-1">Kode Produk:</p>
                                                {Array.isArray(item.code) ? (
                                                    <div className="space-y-2">
                                                        <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground text-center italic border border-border/50">
                                                            {item.code.length} kode voucher tersedia
                                                        </div>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="w-full text-xs h-7">
                                                                    <Eye className="h-3 w-3 mr-2" />
                                                                    Lihat Semua Kode
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                                                                <DialogHeader>
                                                                    <DialogTitle>Kode Produk</DialogTitle>
                                                                    <DialogDescription>
                                                                        Daftar {item.code.length} kode dari transaksi {item.id}
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
                                                                    {item.code.map((code: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-2 rounded border bg-muted/30 text-xs font-mono">
                                                                            <span className="truncate mr-2">{code}</span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 shrink-0"
                                                                                onClick={() => handleCopy(String(code), `mobile-code-${item.id}-${idx}`, "Kode Produk")}
                                                                            >
                                                                                {copiedId === `mobile-code-${item.id}-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="pt-2">
                                                                    <Button
                                                                        className="w-full"
                                                                        onClick={() => handleCopy((item.code as string[]).join("\n"), `mobile-bulk-all-${item.id}`, "Semua Kode")}
                                                                    >
                                                                        {copiedId === `mobile-bulk-all-${item.id}` ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                                                        Salin Semua ({item.code.length})
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                ) : (
                                                    <div className="bg-muted/50 p-2 rounded text-xs font-mono break-all border border-border/50 flex justify-between items-center gap-2">
                                                        <span>{item.code}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleCopy(String(item.code), `code-${item.id}`, "Kode Produk")}
                                                        >
                                                            {copiedId === `code-${item.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
