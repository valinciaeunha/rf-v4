import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function SiteFooter() {
    return (
        <footer className="border-t border-border/40 bg-background pt-20 pb-10 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] bg-center [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0))]" />

            <div className="container relative z-10 px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center space-x-2">
                            <img src="/logo.png" alt="Redfinger Icon" className="h-8 w-auto" />
                            <span className="font-bold tracking-tighter uppercase text-md">Redfinger.id</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/community"} target="_blank" className="text-muted-foreground hover:text-[#5865F2] transition-colors flex items-center gap-2">
                                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current"><title>Discord</title><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" /></svg>
                                <span className="font-medium text-sm">Join Discord</span>
                            </Link>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-6">
                        <h4 className="font-bold font-[family-name:var(--font-heading)] text-lg">Produk</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/#features" className="hover:text-foreground transition-colors">Fitur Unggulan</Link></li>
                            <li><Link href="/#pricing" className="hover:text-foreground transition-colors">Daftar Harga</Link></li>
                            <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">Cara Order</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Status Server</Link></li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className="space-y-6">
                        <h4 className="font-bold font-[family-name:var(--font-heading)] text-lg">Bantuan</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                            <li><Link href="/activation-guide" className="hover:text-foreground transition-colors">Panduan Aktivasi</Link></li>
                            <li><Link href="/contact" className="hover:text-foreground transition-colors">Kontak Kami</Link></li>
                            <li><Link href="/community" className="hover:text-foreground transition-colors">Komunitas Discord</Link></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-6">
                        <h4 className="font-bold font-[family-name:var(--font-heading)] text-lg">Legalitas</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/terms" className="hover:text-foreground transition-colors">Syarat & Ketentuan</Link></li>
                            <li><Link href="/privacy" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link></li>
                            <li><Link href="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
                            <li><Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link></li>
                        </ul>
                    </div>
                </div>

                <Separator className="bg-border/40" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10">
                    <p className="text-xs text-muted-foreground text-center md:text-left">
                        © {new Date().getFullYear()} <span className="font-semibold text-foreground">PT Kilat Media Teknologi</span>. All rights reserved. <br className="md:hidden" />
                        Redfinger is a trademark of Redfinger, Inc.
                    </p>

                    <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground border border-border/50 px-2 py-1 rounded">QRIS</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground border border-border/50 px-2 py-1 rounded">BCA</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground border border-border/50 px-2 py-1 rounded">Mandiri</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground border border-border/50 px-2 py-1 rounded">E-Wallet</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
