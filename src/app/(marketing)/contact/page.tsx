import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MessageSquare, Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-24 md:py-32 max-w-5xl">
            <div className="text-center space-y-6 mb-16">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-heading)]">
                    Hubungi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Kami</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Tim support kami siap membantu Anda 24/7. Pilih metode komunikasi yang paling nyaman bagi Anda.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {/* WhatsApp Card */}
                <div className="flex flex-col items-center p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group">
                    <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Phone className="h-8 w-8 text-[#25D366]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 font-[family-name:var(--font-heading)]">WhatsApp Support</h3>
                    <p className="text-muted-foreground text-center mb-6">Respon cepat untuk pembelian kode, kendala teknis, dan informasi produk.</p>
                    <Button asChild size="lg" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold w-full sm:w-auto">
                        <Link href={process.env.NEXT_PUBLIC_WHATSAPP_URL || "#"} target="_blank">Chat WhatsApp Sekarang</Link>
                    </Button>
                </div>

                {/* Discord Card */}
                <div className="flex flex-col items-center p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-[#5865F2]/50 transition-all duration-300 group">
                    <div className="w-16 h-16 rounded-full bg-[#5865F2]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        {/* Inline SVG for Discord because Lucide doesn't have it standard */}
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 fill-[#5865F2]"><title>Discord</title><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 font-[family-name:var(--font-heading)]">Join Discord</h3>
                    <p className="text-muted-foreground text-center mb-6">Bergabung dengan komunitas gamer, ikuti giveaway, dan diskusi seputar Redfinger.</p>
                    <Button asChild size="lg" className="bg-[#5865F2] hover:bg-[#5865F2]/90 text-white font-bold w-full sm:w-auto">
                        <Link href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#"} target="_blank">Join Server</Link>
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-center md:text-left p-8 rounded-2xl bg-muted/30 border border-border/50">
                <div className="space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <Mail className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold font-[family-name:var(--font-heading)]">Email Support</h3>
                    </div>
                    <p className="text-muted-foreground">Untuk kerjasama bisnis atau isu akun yang kompleks, silakan kirim email kepada kami.</p>
                    <Link href="mailto:support@redfinger.id" className="text-primary hover:underline font-medium block">support@redfinger.id</Link>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <MapPin className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold font-[family-name:var(--font-heading)]">Alamat Kantor</h3>
                    </div>
                    <p className="text-muted-foreground">PT Kilat Media Teknologi<br />Jl. Asia Afrika No. 45, Bandung<br />Jawa Barat, 40111</p>
                </div>
            </div>
        </div>
    )
}
