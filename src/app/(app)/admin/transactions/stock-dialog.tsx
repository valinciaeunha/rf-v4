"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface StockDialogProps {
    stocks: string[]
    orderId: string
    status?: string
}

export function StockDialog({ stocks, orderId, status }: StockDialogProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const isSuccess = status === 'success'

    if (!stocks || stocks.length === 0) {
        return <span className="text-muted-foreground text-xs">-</span>
    }

    const handleCopy = (text: string, id: string, label: string) => {
        if (!isSuccess) return
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success(`${label} berhasil disalin`)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // If only 1 stock, show inline
    if (stocks.length === 1) {
        return (
            <div className="flex items-center gap-1 max-w-[150px]">
                <code className={cn(
                    "bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 font-mono text-[10px] truncate flex-1",
                    !isSuccess && "opacity-50 select-none cursor-not-allowed"
                )}>
                    {isSuccess ? stocks[0] : "••••••••"}
                </code>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={!isSuccess}
                    className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(stocks[0], `stock-${orderId}`, "Stock")}
                >
                    {copiedId === `stock-${orderId}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
            </div>
        )
    }

    // If 2+ stocks, show dialog button
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {stocks.length} Stock
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Stock Codes</DialogTitle>
                    <DialogDescription>
                        Daftar {stocks.length} stock dari transaksi {orderId}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
                    {stocks.map((stock, idx) => (
                        <div key={idx} className={cn(
                            "flex items-center justify-between p-2 rounded border bg-muted/30 text-xs font-mono",
                            !isSuccess && "opacity-50"
                        )}>
                            <span className="truncate mr-2">{isSuccess ? stock : "••••••••"}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={!isSuccess}
                                className="h-6 w-6 shrink-0"
                                onClick={() => handleCopy(stock, `stock-${orderId}-${idx}`, "Stock")}
                            >
                                {copiedId === `stock-${orderId}-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="pt-2">
                    <Button
                        className="w-full"
                        disabled={!isSuccess}
                        onClick={() => handleCopy(stocks.join("\n"), `bulk-all-${orderId}`, "Semua Stock")}
                    >
                        {copiedId === `bulk-all-${orderId}` ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Salin Semua ({stocks.length})
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
