import { Suspense } from "react"
import { getTokopayMerchantInfo } from "@/lib/tokopay"
import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"
import { sql, and, gte, lt, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Wallet, TrendingUp, RefreshCcw, Activity, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Tokopay Dashboard",
    description: "Monitoring status dan saldo Tokopay",
}

async function TokopayStats() {
    // 1. Fetch data dari API Tokopay (Saldo)
    const merchantInfo = await getTokopayMerchantInfo()

    // 2. Fetch data statistik dari Database lokal
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Kemarin
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(todayStart)

    // Bulan Ini (Februari 2026)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Bulan Lalu (Januari 2026)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)

    // Query Helper
    const getStats = async (start: Date, end: Date) => {
        const result = await db
            .select({
                totalAmount: sql<number>`sum(${transactions.totalAmount})`, // Fixed: totalPrice -> totalAmount
                count: sql<number>`count(*)`
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.status, "success"),
                    gte(transactions.createdAt, start),
                    lt(transactions.createdAt, end)
                )
            )
        return result[0]
    }

    const [today, yesterday, thisMonth, lastMonth] = await Promise.all([
        getStats(todayStart, todayEnd),
        getStats(yesterdayStart, yesterdayEnd),
        getStats(thisMonthStart, thisMonthEnd),
        getStats(lastMonthStart, lastMonthEnd)
    ])

    // Format Currency
    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0)
    }

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

    return (
        <div className="space-y-6">
            {/* Kartu Saldo Tokopay */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-primary text-primary-foreground shadow-md relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Tersedia</CardTitle>
                        <Wallet className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {merchantInfo?.data ? formatIDR(merchantInfo.data.saldo_tersedia) : "Rp -"}
                        </div>
                        <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                            {merchantInfo?.data?.nama_toko || "Gagal memuat data"}
                            <Activity className="h-3 w-3 inline ml-1" />
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Tertahan</CardTitle>
                        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {merchantInfo?.data ? formatIDR(merchantInfo.data.saldo_tertahan) : "Rp -"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Menunggu settlement
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transaksi Hari Ini</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatIDR(Number(today.totalAmount))}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {today.count} Transaksi Sukses
                            {Number(today.count) > Number(yesterday.count) ? (
                                <span className="text-green-500 flex items-center text-[10px] ml-1 bg-green-500/10 px-1 rounded-sm">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> Naik
                                </span>
                            ) : (
                                <span className="text-red-500 flex items-center text-[10px] ml-1 bg-red-500/10 px-1 rounded-sm">
                                    <ArrowDownLeft className="h-3 w-3 mr-0.5" /> Turun
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Statistik Detail Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {/* Kemarin */}
                <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Kemarin
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold">{formatIDR(Number(yesterday.totalAmount))}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {yesterday.count} sukses
                        </p>
                    </CardContent>
                </Card>

                {/* Bulan Ini */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {monthNames[thisMonthStart.getMonth()]} {thisMonthStart.getFullYear()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold text-primary">
                            {formatIDR(Number(thisMonth.totalAmount))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {thisMonth.count} sukses total
                        </p>
                    </CardContent>
                </Card>

                {/* Bulan Lalu */}
                <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {monthNames[lastMonthStart.getMonth()]} {lastMonthStart.getFullYear()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold">
                            {formatIDR(Number(lastMonth.totalAmount))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {lastMonth.count} sukses total
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 bg-muted/40 p-4 rounded-lg border text-xs text-muted-foreground flex items-center gap-3">
                <Activity className="h-4 w-4 opacity-50" />
                <p>
                    Data saldo diambil <strong>real-time</strong> dari API Tokopay.
                    Data transaksi dihitung dari database Redfinger untuk akurasi pencatatan internal.
                </p>
            </div>
        </div>
    )
}

function StatsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[150px] mb-2" />
                            <Skeleton className="h-3 w-[80px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-[120px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[150px] mb-2" />
                            <Skeleton className="h-3 w-[100px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function TokopayPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Suspense fallback={<StatsSkeleton />}>
                <TokopayStats />
            </Suspense>
        </div>
    )
}
