"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart, LayoutDashboard, ArrowRight } from "lucide-react"
import { motion } from "motion/react"

export function CTASection() {
    return (
        <section className="w-full py-24 md:py-32 bg-background relative overflow-hidden text-center">
            {/* Background Gradients */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center space-y-10"
                >
                    <div className="space-y-6 max-w-3xl">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)] leading-tight">
                            Beli Kode, <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/50">
                                Aktifkan Sekarang.
                            </span>
                        </h2>
                        <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                            Partner terpercaya untuk komunitas Gamer Indonesia. <br className="hidden sm:block" />
                            Proses <strong>instan</strong>, <strong>100% legal</strong>, dan bergaransi resmi.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
                        >
                            <Link href="/login">
                                Beli Sekarang
                                <ShoppingCart className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="h-12 px-8 text-base border-border/50 bg-background/50 backdrop-blur-sm hover:bg-muted/50 transition-all duration-300 hover:scale-105"
                        >
                            <Link href="/dashboard">
                                Dashboard
                                <LayoutDashboard className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
