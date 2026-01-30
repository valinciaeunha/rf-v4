"use client"

import { Zap, ShieldCheck, Mail, Globe, Clock, CreditCard } from "lucide-react"
import { motion } from "motion/react"

const features = [
    {
        title: "Pengiriman Instan",
        description: "Kode redeem dikirim otomatis segera setelah pembayaran terkonfirmasi.",
        icon: Zap,
    },
    {
        title: "100% Kode Legal",
        description: "Semua kode berasal dari partner resmi Redfinger. Jaminan aman.",
        icon: ShieldCheck,
    },
    {
        title: "Metode Bayar Lengkap",
        description: "Bayar mudah pakai QRIS, E-Wallet, atau Transfer Bank seluruh Indonesia.",
        icon: CreditCard,
    },
    {
        title: "Harga Agen Bersaing",
        description: "Nikmati harga khusus yang lebih hemat dibanding beli langsung via CC.",
        icon: Globe,
    },
    {
        title: "Support 24 Jam",
        description: "Tim support kami siap membantu kendala aktivasi kapan saja.",
        icon: Mail,
    },
    {
        title: "Sistem Otomatis",
        description: "Order kami aktif 24 jam non-stop, beli kapan saja kode langsung sampai.",
        icon: Clock,
    },
]

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export function FeaturesSection() {
    return (
        <section id="features" className="w-full py-20 md:py-32 bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl font-[family-name:var(--font-heading)]">
                        Kenapa Beli di <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Reseller Resmi?</span>
                    </h2>
                    <p className="max-w-[700px] text-muted-foreground md:text-lg leading-relaxed">
                        Kemudahan transaksi lokal dengan keamanan terjamin untuk pengalaman Cloud Phone Anda.
                    </p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="mx-auto grid max-w-6xl items-stretch gap-3 md:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={item}
                            className="group relative p-4 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 bg-gradient-to-b from-card to-card/50"
                        >
                            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 md:mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <feature.icon className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <h3 className="text-base md:text-xl font-bold text-foreground mb-2 md:mb-3 font-[family-name:var(--font-heading)]">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
