
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Home, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const id = searchParams.get("id")

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="max-w-md w-full border-border/50 shadow-2xl bg-card/60 backdrop-blur-sm p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center relative">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                            </motion.div>
                            <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping duration-1000" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Pembayaran Berhasil!
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Terima kasih. Transaksi Anda <span className="font-mono font-medium text-primary">{id}</span> telah berhasil diproses.
                        </p>
                    </div>

                    <div className="grid gap-3 pt-4">
                        <Button className="w-full group" size="lg" onClick={() => router.push("/dashboard")}>
                            Ke Dashboard
                            <Home className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => router.push("/history")}>
                            Lihat Riwayat Transaksi
                            <Receipt className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
