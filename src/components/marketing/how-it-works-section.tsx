"use client"

import { ShoppingBag, CreditCard, Ticket, CheckCircle2, ArrowRight } from "lucide-react"
import { motion } from "motion/react"

const steps = [
    {
        title: "Pilih Paket",
        description: "Pilih paket VIP atau KVIP sesuai durasi.",
        icon: ShoppingBag,
    },
    {
        title: "Bayar",
        description: "Selesaikan transaksi via QRIS atau Bank.",
        icon: CreditCard,
    },
    {
        title: "Terima Kode",
        description: "Salin kode dari WhatsApp atau Email.",
        icon: Ticket,
    },
    {
        title: "Redeem",
        description: "Aktivasi kode di aplikasi Redfinger.",
        icon: CheckCircle2,
    },
]

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
}

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="w-full py-24 md:py-32 bg-background relative border-t border-border/50 overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col items-center text-center mb-20 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl font-[family-name:var(--font-heading)]">
                        Cara Beli & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Aktivasi</span>
                    </h2>
                    <p className="max-w-[700px] text-muted-foreground md:text-lg">
                        Empat langkah mudah untuk mulai menggunakan Redfinger Cloud Phone.
                    </p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 relative"
                >
                    {/* Connecting line for desktop */}
                    <div className="hidden lg:block absolute top-[2.5rem] left-[10%] right-[10%] h-[2px] bg-border/50 -z-10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            variants={item}
                            className="flex flex-col items-center text-center group relative"
                        >
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-card border border-border group-hover:border-primary/50 group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    <step.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />

                                    {/* Step number badge */}
                                    <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border-4 border-background shadow-sm">
                                        {index + 1}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 px-4">
                                <h3 className="text-xl font-bold text-foreground font-[family-name:var(--font-heading)] group-hover:text-primary transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>

                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
