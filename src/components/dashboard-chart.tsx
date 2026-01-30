"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

interface ChartDataPoint {
    date: string
    transactions: number
}

interface DashboardChartProps {
    data: ChartDataPoint[]
}

const chartConfig = {
    transactions: {
        label: "Transaksi",
        color: "var(--foreground)",
    },
} satisfies ChartConfig

export function DashboardChart({ data }: DashboardChartProps) {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Ringkasan Transaksi</CardTitle>
                <CardDescription>
                    Volume transaksi harian selama 60 hari terakhir
                </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <ChartContainer
                    config={chartConfig}
                    className="h-[250px] w-full min-h-[250px]"
                >
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="fillTransactions" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-transactions)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-transactions)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("id-ID", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("id-ID", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey="transactions"
                            type="natural"
                            fill="url(#fillTransactions)"
                            stroke="var(--color-transactions)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
