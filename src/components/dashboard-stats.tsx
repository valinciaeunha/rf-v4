

import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import Link from "next/link"

interface StatItem {
    label: string
    value: string
    trend: string
    desc: string
}

interface DashboardStatsProps {
    stats: StatItem[]
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs mb-6 lg:grid-cols-4 lg:gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className="@container/card gap-0 relative overflow-hidden">
                    <CardHeader className="px-3 pb-1 pt-3">
                        <div className="flex justify-between items-start w-full gap-2">
                            <CardDescription className="text-xs truncate" title={stat.label}>{stat.label}</CardDescription>
                            <Badge variant="outline" className="text-muted-foreground border-border px-1.5 py-0 text-[10px] h-5 shrink-0">
                                <TrendingUp className="mr-1 size-2.5" />
                                {stat.trend}
                            </Badge>
                        </div>
                        <CardTitle className="text-base font-semibold tabular-nums @[250px]/card:text-xl mt-1">
                            {stat.value}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="px-3 pb-3 pt-0 flex items-center justify-between">
                        <div className="line-clamp-1 flex gap-1.5 text-xs font-medium text-muted-foreground">
                            {stat.desc} <TrendingUp className="size-3 text-muted-foreground" />
                        </div>
                        {stat.label === "Saldo" && (
                            <Button asChild size="sm" className="h-5 px-1.5 text-[9px] bg-foreground text-background hover:bg-foreground/90 shadow-sm border-none rounded-md">
                                <Link href="/billing">
                                    Top Up <ArrowUpRight className="ml-0.5 size-2.5" />
                                </Link>
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
