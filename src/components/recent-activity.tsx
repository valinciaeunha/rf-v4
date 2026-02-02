
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
        <Card>
            <CardHeader className="pb-4">
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                    Anda melakukan {activities.length} transaksi bulan ini.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="divide-y divide-border">
                    {activities.map((activity, index) => {
                        const Icon = iconMap[activity.type] || Smartphone
                        const isPositive = activity.positive

                        return (
                            <div key={index} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                                {/* Icon */}
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isPositive
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-primary/10 text-primary"
                                    }`}>
                                    <Icon className="h-5 w-5" />
                                </div>

                                {/* Title & Description */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {activity.desc}
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className={`text-sm font-semibold tabular-nums shrink-0 ${isPositive ? "text-green-500" : ""}`}>
                                    {activity.amount}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

