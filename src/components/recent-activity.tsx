
import {
    Smartphone,
    Wallet,
    Ticket,
    Undo2,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface ActivityItem {
    type: string
    title: string
    desc: string
    amount: string
    positive: boolean
}

interface RecentActivityProps {
    activities: ActivityItem[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    smartphone: Smartphone,
    wallet: Wallet,
    ticket: Ticket,
    undo2: Undo2,
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
            <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                    Anda melakukan {activities.length} transaksi bulan ini.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 space-y-4">
                {activities.map((activity, index) => {
                    const Icon = iconMap[activity.type] || Smartphone
                    const isPositive = activity.positive

                    return (
                        <div key={index} className="flex items-center">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-md ${isPositive
                                ? "bg-green-500/10 text-green-500"
                                : "bg-primary/10 text-primary"
                                }`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {activity.desc}
                                </p>
                            </div>
                            <div className={`ml-auto font-medium ${isPositive ? "text-green-500" : ""}`}>
                                {activity.amount}
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
