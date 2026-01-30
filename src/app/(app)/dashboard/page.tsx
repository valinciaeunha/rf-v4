"use client";

import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/actions/auth";
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

type DashboardData = any;

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch real user data for balance
                const user = await getSessionUser();
                const realBalance = user?.balance ? `Rp ${parseInt(user.balance).toLocaleString('id-ID')}` : "Rp 0";

                // Mock data temporarily
                await new Promise(r => setTimeout(r, 1000)); // Simulate delay
                const dummyData = {
                    stats: [
                        { label: "Saldo", value: realBalance, trend: "+0%", desc: "available balance" },
                        { label: "Total Revenue", value: "Rp 12.500.000", trend: "+20.1%", desc: "from last month" },
                        { label: "Subscriptions", value: "+2350", trend: "+180.1%", desc: "from last month" },
                        { label: "Sales", value: "+12,234", trend: "+19%", desc: "from last month" },
                    ],
                    chartData: [
                        { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
                        { name: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
                        { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
                        { name: "Apr", total: Math.floor(Math.random() * 5000) + 1000 },
                        { name: "May", total: Math.floor(Math.random() * 5000) + 1000 },
                        { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
                    ],
                    recentActivity: [
                        {
                            user: { name: "Jackson Lee", email: "jackson.lee@email.com", avatar: "/avatars/01.png" },
                            amount: "+$1,999.00",
                            status: "Success"
                        },
                        {
                            user: { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", avatar: "/avatars/03.png" },
                            amount: "+$299.00",
                            status: "Processing"
                        },
                    ]
                };

                setData(dummyData);
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

                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    {/* Chart Skeleton */}
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-60" />
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6">
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        </CardContent>
                    </Card>

                    {/* Recent Activity Skeleton */}
                    <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
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

    if (!data) return null;

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6">
            <DashboardStats stats={data.stats} />

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <DashboardChart data={data.chartData} />
                <RecentActivity activities={data.recentActivity} />
            </div>
        </div>
    );
}
