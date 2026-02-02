"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Shield, Zap, Headset } from "lucide-react"
import { motion } from "motion/react"
import { WorldMap } from "@/components/ui/world-map"
import { TextGradient } from "@/components/text-gradient"
import { useEffect, useState } from "react"
import { getUserCount } from "@/lib/actions/users"
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    }
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
}

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    }
}

export function HeroSection() {
    const [userCount, setUserCount] = useState<number>(0);

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const count = await getUserCount();
                setUserCount(count);
            } catch (error) {
                console.error("Failed to fetch user count:", error);
            }
        };

        fetchUserCount();
    }, []);

    const displayCount = userCount > 2000 ? userCount.toLocaleString() : "2,000+";
    const remainingCount = userCount > 2000 ? userCount - 5 : 2000;
    const badgeText = remainingCount >= 1000
        ? `+${Math.floor(remainingCount / 1000)}K`
        : `+${remainingCount}`;

    return (
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {/* World Map Background */}
                <div className="absolute inset-0 opacity-40">
                    <WorldMap
                        dots={[
                            // Bandung, Indonesia to Redfinger server locations (Asia-Pacific only)
                            { start: { lat: -6.9175, lng: 107.6191 }, end: { lat: 22.3193, lng: 114.1694 } }, // Bandung to Hong Kong
                            { start: { lat: -6.9175, lng: 107.6191 }, end: { lat: 13.7563, lng: 100.5018 } }, // Bandung to Thailand (Bangkok)
                            { start: { lat: -6.9175, lng: 107.6191 }, end: { lat: 1.3521, lng: 103.8198 } }, // Bandung to Singapore
                            { start: { lat: -6.9175, lng: 107.6191 }, end: { lat: 25.0330, lng: 121.5654 } }, // Bandung to Taiwan (Taipei)
                            { start: { lat: -6.9175, lng: 107.6191 }, end: { lat: 35.6762, lng: 139.6503 } }, // Bandung to Tokyo, Japan
                        ]}
                    />
                </div>

                {/* Diagonal gradient beams - centered */}
                {/* Beam 1 - upper */}
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[120vw] h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent rotate-[15deg] blur-[2px]" />
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[120vw] h-[40px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent rotate-[15deg] blur-2xl" />

                {/* Beam 2 - center */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[130vw] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[12deg] blur-[2px]" />
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[130vw] h-[50px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent rotate-[12deg] blur-3xl" />

                {/* Beam 3 - lower */}
                <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-[110vw] h-[2px] bg-gradient-to-r from-transparent via-white/8 to-transparent rotate-[18deg] blur-[2px]" />
                <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-[110vw] h-[30px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent rotate-[18deg] blur-2xl" />

                {/* Beam 4 - opposite tilt */}
                <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[120vw] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[-12deg] blur-[2px]" />
                <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[120vw] h-[35px] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent rotate-[-12deg] blur-2xl" />

                {/* Beam 5 - opposite tilt lower */}
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[125vw] h-[2px] bg-gradient-to-r from-transparent via-white/8 to-transparent rotate-[-15deg] blur-[2px]" />
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[125vw] h-[45px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent rotate-[-15deg] blur-3xl" />

                {/* Center glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-white/[0.02] rounded-full blur-[100px]" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 mx-auto py-20">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center text-center space-y-8"
                >
                    {/* Badge */}
                    <motion.div variants={fadeInUp}>
                        <Link
                            href="#pricing"
                            className="group inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all duration-300 hover:border-border"
                        >
                            <img src="/logo.png" alt="Redfinger" className="h-4 w-auto" />
                            <span>Reseller Resmi Redfinger Indonesia</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Main heading */}
                    <motion.div variants={fadeInUp} className="space-y-6 max-w-4xl">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-[family-name:var(--font-heading)]">
                            Beli Kode Redeem
                            <br />
                            <TextGradient
                                spread={150}
                                duration={3}
                                highlightColor="var(--foreground)"
                                baseColor="var(--muted-foreground)"
                            >
                                Redfinger Cloud Phone
                            </TextGradient>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
                            Akses cloud phone premium tanpa kartu kredit. Proses instan,
                            pembayaran mudah, dan terima kode redeem dalam hitungan detik.
                        </p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-row gap-3 sm:gap-4 pt-4"
                    >
                        <Button
                            asChild
                            size="lg"
                            className="h-10 sm:h-12 px-4 sm:px-8 text-sm sm:text-base font-semibold shadow-sm transition-all duration-300 hover:scale-[1.02]"
                        >
                            <Link href="/dashboard">
                                Beli Kode Sekarang
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-10 sm:h-12 px-4 sm:px-8 text-sm sm:text-base border-border/50 hover:bg-muted/50"
                        >
                            <Link href="#pricing">Lihat Daftar Harga</Link>
                        </Button>
                    </motion.div>

                    {/* Trust indicators */}
                    {/* Trust indicators */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-6 pt-8 text-[10px] sm:text-sm text-muted-foreground"
                    >
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Shield className="h-3 w-3 sm:h-5 sm:w-5 text-primary" />
                            <span>100% Aman & Terpercaya</span>
                        </div>
                        <div className="hidden sm:block w-px h-4 bg-border" />
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Zap className="h-3 w-3 sm:h-5 sm:w-5 text-primary" />
                            <span>Proses Instan</span>
                        </div>
                        <div className="hidden sm:block w-px h-4 bg-border" />
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Headset className="h-3 w-3 sm:h-5 sm:w-5 text-primary" />
                            <span>24/7 Support</span>
                        </div>
                    </motion.div>

                    {/* Avatar group - social proof */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col items-center gap-4 pt-8"
                    >
                        <AvatarGroup>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Avatar key={i} size="lg" className="border-2 border-background">
                                    <AvatarImage src={`/avatar/${i}.webp`} alt={`User ${i}`} />
                                    <AvatarFallback>U{i}</AvatarFallback>
                                </Avatar>
                            ))}
                            <AvatarGroupCount className="border-2 border-background bg-foreground text-background font-bold">
                                {badgeText}
                            </AvatarGroupCount>
                        </AvatarGroup>
                        <p className="text-sm text-muted-foreground">
                            Dipercaya oleh <span className="font-semibold text-foreground">{displayCount}</span> pengguna aktif
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
