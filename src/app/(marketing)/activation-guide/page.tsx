import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Download, Key, Smartphone } from "lucide-react"

export default function ActivationGuidePage() {
    const steps = [
        {
            icon: <Download className="h-6 w-6 text-primary" />,
            title: "Download Aplikasi Redfinger",
            description: "Unduh aplikasi resmi Redfinger dari Google Play Store atau website resmi redfinger.com. Pastikan Anda mengunduh versi terbaru untuk performa terbaik.",
        },
        {
            icon: <Smartphone className="h-6 w-6 text-primary" />,
            title: "Login atau Daftar Akun",
            description: "Buka aplikasi dan login menggunakan akun Google, Facebook, atau Line Anda. Jika belum punya akun, silakan daftar terlebih dahulu gratis.",
        },
        {
            icon: <Key className="h-6 w-6 text-primary" />,
            title: "Siapkan Kode Redeem",
            description: "Pastikan Anda sudah membeli kode redeem dari Redfinger.id. Salin kode (CDKey) yang Anda terima dari dashboard atau WhatsApp kami.",
        },
        {
            icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
            title: "Tukarkan Kode (Redeem)",
            description: "Di dalam aplikasi Redfinger, masuk ke menu Profile > Redeem Code. Tempelkan kode Anda (12-16 digit) dan klik 'Confirm/Tukar'. Cloud Phone akan aktif instan!",
        },
    ]

    return (
        <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
            <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-heading)]">
                    Panduan <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Aktivasi</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Ikuti langkah mudah berikut untuk mengaktifkan layanan Cloud Phone Anda dalam hitungan menit.
                </p>
            </div>

            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
                {steps.map((step, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Icon Wrapper */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            {step.icon}
                        </div>

                        {/* Content Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold font-[family-name:var(--font-heading)] text-xl">Langkah {i + 1}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-20 text-center space-y-6">
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-heading)]">Sudah punya kodenya?</h3>
                    <p className="text-muted-foreground mb-6">Jangan tunggu lama, aktifkan sekarang dan nikmati gaming 24 jam non-stop.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="font-bold">
                            <Link href="https://play.google.com/store/apps/details?id=com.redfinger.global" target="_blank">
                                Download App
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/contact">
                                Butuh Bantuan?
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
