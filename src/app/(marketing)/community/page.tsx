"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Gift, Zap, Gamepad2 } from "lucide-react"

export default function CommunityPage() {
    const chatPreview = [
        {
            user: "FischGrinder",
            avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
            role: "Member",
            message: "Script Fishit-nya lancar banget buat auto-catch Caiman di Swamp! AFK semalaman aman.",
            time: "Baru saja",
            color: "text-zinc-400"
        },
        {
            user: "Redfinger Admin",
            avatar: "/logo.png",
            role: "Admin",
            message: "Mantap! Settingan delay berapa ms biar aman? Jangan lupa pakai fitur Anti-AFK bawaan Redfinger ya.",
            time: "Baru saja",
            color: "text-[#5865F2]"
        },
        {
            user: "RobloxSultan",
            avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sultan",
            role: "Member",
            message: "Pake 1500ms aman min, udah dapet 3 Mythical hari ini. Gak panas HP karena jalan di cloud 🔥",
            time: "1 menit lalu",
            color: "text-zinc-400"
        }
    ]

    return (
        <div className="w-full relative overflow-hidden bg-background">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#5865F2]/10 rounded-full blur-[120px] opacity-50" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-[#5865F2] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#5865F2]/40 mb-8 relative group">
                            <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-14 md:w-14 fill-white relative z-10"><title>Discord</title><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" /></svg>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-[family-name:var(--font-heading)] mb-6">
                            Join Komunitas <span className="text-[#5865F2]">Discord</span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
                            Rumah bagi 5.000+ pengguna Redfinger. Diskusi strategi game, info promo, dan mabar setiap hari tanpa toxic.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
                            <Button asChild size="lg" className="bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold h-14 px-8 text-lg shadow-xl shadow-[#5865F2]/20 hover:scale-105 transition-all w-full sm:w-auto">
                                <Link href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#"} target="_blank">
                                    Join Server Discord
                                </Link>
                            </Button>
                        </div>

                        <div className="pt-10 flex items-center justify-center gap-8 text-sm font-medium text-muted-foreground">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                542 Online
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-5 h-5 rounded-full bg-zinc-700 border border-background"></div>
                                    ))}
                                </div>
                                5,839 Members
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Chat Preview Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="container max-w-2xl mx-auto mt-20 relative z-10"
                >
                    <div className="rounded-xl border border-[#202225] bg-[#36393f] shadow-2xl overflow-hidden">
                        <div className="bg-[#2f3136] px-4 py-3 border-b border-[#202225] flex items-center gap-2">
                            <span className="text-[#96989d] text-xl">#</span>
                            <span className="font-bold text-white">general-chat</span>
                            <span className="text-[#72767d] text-xs ml-2 hidden sm:inline-block"> — Tempat ngobrol santai member Redfinger</span>
                        </div>
                        <div className="p-4 space-y-4 font-sans text-left">
                            {chatPreview.map((chat, i) => (
                                <div key={i} className="flex gap-4 group hover:bg-[#32353b]/50 p-2 rounded-lg -mx-2 transition-colors">
                                    <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                                        <AvatarImage src={chat.avatar} />
                                        <AvatarFallback className="bg-[#5865F2] text-white">U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`font-semibold hover:underline cursor-pointer ${chat.role === 'Admin' ? 'text-[#5865F2]' : 'text-white'}`}>
                                                {chat.user}
                                            </span>
                                            {chat.role === 'Admin' && (
                                                <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded flex items-center h-4 font-bold">BOT</span>
                                            )}
                                            <span className="text-xs text-[#72767d]">{chat.time}</span>
                                        </div>
                                        <p className="text-[#dcddde] text-sm leading-relaxed">{chat.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="h-12 mt-4 bg-[#40444b] rounded-lg flex items-center px-4 text-[#72767d] text-sm">
                                Message #general-chat
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features/Benefit Section */}
            <section className="container mx-auto px-4 pb-32">
                <div className="mx-auto grid max-w-6xl items-stretch gap-3 md:gap-6 grid-cols-1 md:grid-cols-3">
                    {[
                        { title: "Event & Giveaway", desc: "Rutin mengadakan event berhadiah kode redeem gratis dan saldo e-wallet khusus member discord.", icon: Gift },
                        { title: "Support Prioritas", desc: "Punya kendala? Admin dan moderator kami lebih cepat merespon keluhan Anda via tiket discord.", icon: Zap },
                        { title: "Mabar & Komunitas", desc: "Cari teman untuk farming bareng atau diskusi build game favorit Anda di channel diskusi.", icon: Gamepad2 }
                    ].map((item, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            key={i}
                            className="group relative p-4 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-[#5865F2]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#5865F2]/10 hover:-translate-y-1 bg-gradient-to-b from-card to-card/50"
                        >
                            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-[#5865F2]/10 text-[#5865F2] mb-4 md:mb-6 group-hover:bg-[#5865F2] group-hover:text-white transition-colors duration-300">
                                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <h3 className="text-base md:text-xl font-bold text-foreground mb-2 md:mb-3 font-[family-name:var(--font-heading)] group-hover:text-[#5865F2] transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
