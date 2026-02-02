"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardStats } from "@/components/dashboard-stats";
import { DashboardChart } from "@/components/dashboard-chart";
import { RecentActivity } from "@/components/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { toast } from "sonner";

interface DashboardData {
    stats: Array<{ label: string; value: string; trend: string; desc: string }>;
    chartData: Array<{ date: string; transactions: number; deposits?: number }>;
    recentActivity: Array<{
        type: string;
        title: string;
        desc: string;
        amount: string;
        positive: boolean;
    }>;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getDashboardData();

                if (!result.success || !result.data) {
                    toast.error(result.error || "Gagal memuat data");
                    setLoading(false);
                    return;
                }

                const { stats, chartData, recentActivity } = result.data;
                // Transform stats to match component format
                const formattedStats = [
                    {
                        label: "Saldo",
                        value: stats.balance,
                        trend: "+0%",
                        desc: "Tersedia",
                    },
                    {
                        label: "Total Deposit",
                        value: stats.totalDeposits,
                        trend: "+0%",
                        desc: "top up sukses",
                    },
                    {
                        label: "Transaksi",
                        value: stats.totalTransactions.toString(),
                        trend: `${stats.successRate}%`,
                        desc: `${stats.successTransactions} sukses, ${stats.expiredTransactions} expired`,
                    },
                    {
                        label: "Total Belanja",
                        value: stats.totalSpent,
                        trend: "+0%",
                        desc: "pengeluaran",
                    },
                ];

                // Transform chart data
                const formattedChartData = chartData.map((item) => ({
                    date: item.date,
                    transactions: item.transactions,
                }));

                // Transform recent activity
                // Deposits = positive (+ green)
                // Purchases = negative (-) ONLY if paid with balance
                const formattedActivity = recentActivity.map((item) => {
                    const isDeposit = item.type === "deposit";
                    const showMinus = !isDeposit && item.paidWithBalance;
                    const showPlus = isDeposit && item.positive; // Only successful deposits show +

                    return {
                        type: isDeposit ? "wallet" : "smartphone",
                        title: item.title,
                        desc: item.desc,
                        amount: showPlus ? `+${item.amount}` : showMinus ? `-${item.amount}` : item.amount,
                        positive: showPlus, // Green for successful deposits
                    };
                });

                setData({
                    stats: formattedStats,
                    chartData: formattedChartData,
                    recentActivity: formattedActivity,
                });
            } catch (error) {
                console.error(error);
                toast.error("Terjadi kesalahan koneksi");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 flex-col p-4 md:p-6">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 lg:gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="gap-0 relative overflow-hidden">
                            <CardHeader className="px-3 pb-1 pt-3">
                                <div className="flex justify-between items-start w-full gap-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-5 w-10 rounded-full" />
                                </div>
                                <Skeleton className="h-6 w-24 mt-1" />
                            </CardHeader>
                            <CardFooter className="px-3 pb-3 pt-0 flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col gap-4 md:gap-6">
                    {/* Chart Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-60" />
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6">
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        </CardContent>
                    </Card>

                    {/* Recent Activity Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent className="px-4 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <div className="ml-4 space-y-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="ml-auto h-4 w-16" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
                <p className="text-muted-foreground">Tidak ada data untuk ditampilkan</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6">
            <DashboardStats stats={data.stats} />

            <div className="flex flex-col gap-4 md:gap-6">
                <DashboardChart data={data.chartData} />
                <RecentActivity activities={data.recentActivity} />
            </div>
        </div>
    );
}
