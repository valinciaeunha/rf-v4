import { Star } from "lucide-react"

const testimonials = [
    { name: "Agus H.", role: "Verified Buyer", content: "Beli kode di sini beneran instan. Baru bayar 1 menit langsung dapet kodenya. Top!", avatar: "AH" },
    { name: "Rina K.", role: "Regular Reseller", content: "Harga paling bersaing buat saya jual lagi. CS fast respon banget.", avatar: "RK" },
    { name: "Fajar P.", role: "Hardcore Gamer", content: "Udah langganan 6 bulan. Kodenya selalu legal dan aman. Recomended!", avatar: "FP" },
    { name: "Budi S.", role: "Verified Buyer", content: "Proses cepat tak pakai ribet. Langsung landing di email kodenya.", avatar: "BS" },
    { name: "Lani M.", role: "Gamer", content: "Adminnya ramah kalau ada yang kurang paham dipandu sampai bisa.", avatar: "LM" },
    { name: "Dedi J.", role: "Reseller", content: "Sangat membantu buat stok jualan di toko offline saya. Mantap!", avatar: "DJ" },
    { name: "Sari W.", role: "Verified Buyer", content: "Pertama kali beli langsung puas. Gak perlu nunggu lama!", avatar: "SW" },
    { name: "Hendra T.", role: "Pro Gamer", content: "Langganan tetap di sini. Harga oke, pelayanan mantap.", avatar: "HT" },
    { name: "Maya R.", role: "Casual Gamer", content: "Recommended banget! Kode selalu work tanpa masalah.", avatar: "MR" },
    { name: "Eko P.", role: "Reseller", content: "Buat reseller kayak saya ini surganya. Margin profit bagus.", avatar: "EP" },
    { name: "Novi A.", role: "Verified Buyer", content: "CS nya sabar banget jelasin cara redeem. Thank you!", avatar: "NA" },
    { name: "Rizky F.", role: "Gamer", content: "Udah 1 tahun langganan. Never disappointed!", avatar: "RF" },
    { name: "Dewi S.", role: "Verified Buyer", content: "Proses pembayaran gampang, kode langsung masuk.", avatar: "DS" },
    { name: "Andi W.", role: "Hardcore Gamer", content: "Best place to buy Redfinger codes. Period.", avatar: "AW" },
    { name: "Putri L.", role: "Casual Gamer", content: "Harga murah kualitas terjamin. Auto repeat order!", avatar: "PL" },
    { name: "Joko M.", role: "Reseller", content: "Partner terbaik buat bisnis redeem code.", avatar: "JM" },
    { name: "Ratna H.", role: "Verified Buyer", content: "Cepet banget prosesnya, gak sampai 5 menit udah beres.", avatar: "RH" },
    { name: "Bayu K.", role: "Pro Gamer", content: "Kode nya legit 100%. Sudah buktikan sendiri.", avatar: "BK" },
    { name: "Sinta P.", role: "Gamer", content: "Pelayanan ramah, harga bersahabat. Mantap!", avatar: "SP" },
    { name: "Irfan D.", role: "Verified Buyer", content: "Beli di sini aman dan terpercaya. Recommended!", avatar: "ID" },
    { name: "Wulan T.", role: "Casual Gamer", content: "Ga ribet, tinggal bayar langsung dapat kode.", avatar: "WT" },
    { name: "Toni S.", role: "Reseller", content: "Stok selalu ready, cocok buat reseller.", avatar: "TS" },
    { name: "Lisa N.", role: "Verified Buyer", content: "Admin fast response 24 jam. Salut!", avatar: "LN" },
    { name: "Dimas A.", role: "Pro Gamer", content: "Udah coba banyak tempat, di sini paling oke.", avatar: "DA" },
    { name: "Yuni K.", role: "Gamer", content: "Kode nya work semua, ga pernah ada masalah.", avatar: "YK" },
    { name: "Cahyo R.", role: "Verified Buyer", content: "Pengiriman instan, kode langsung bisa dipakai.", avatar: "CR" },
    { name: "Mega W.", role: "Casual Gamer", content: "Harga terbaik se-Indonesia. Top markotop!", avatar: "MW" },
    { name: "Surya P.", role: "Reseller", content: "Profit margin bagus, customer happy.", avatar: "SuP" },
    { name: "Fitri H.", role: "Verified Buyer", content: "Beli tengah malam juga tetap dilayani. Keren!", avatar: "FH" },
    { name: "Arief M.", role: "Pro Gamer", content: "Langganan 2 tahun, service konsisten bagus.", avatar: "AM" },
    { name: "Indah S.", role: "Gamer", content: "Cara redeem dijelasin dengan jelas. Helpful!", avatar: "IS" },
    { name: "Gilang T.", role: "Verified Buyer", content: "Transaksi aman, kode asli. Recommended!", avatar: "GT" },
    { name: "Anita R.", role: "Casual Gamer", content: "Beli di sini ga pernah kecewa. The best!", avatar: "AR" },
    { name: "Bambang K.", role: "Reseller", content: "Supplier terpercaya untuk bisnis saya.", avatar: "BaK" },
    { name: "Citra D.", role: "Verified Buyer", content: "Proses cepat, harga murah. Apa lagi?", avatar: "CD" },
    { name: "Doni L.", role: "Pro Gamer", content: "Kualitas kode terjamin. Worth every rupiah!", avatar: "DL" },
    { name: "Erni W.", role: "Gamer", content: "CS nya helpful banget. Suka deh!", avatar: "EW" },
    { name: "Ferry S.", role: "Verified Buyer", content: "Auto repeat order setiap bulan!", avatar: "FS" },
    { name: "Galih P.", role: "Casual Gamer", content: "Simple, cepat, dan terpercaya.", avatar: "GP" },
    { name: "Hesti M.", role: "Reseller", content: "Partner bisnis terbaik. Recommended!", avatar: "HM" },
]

export function TestimonialsSection() {
    // Split 40 testimonials into 2 rows of 20 each
    const row1 = testimonials.slice(0, 20)
    const row2 = testimonials.slice(20, 40)

    return (
        <section id="testimonials" className="w-full py-20 md:py-32 bg-background relative border-t border-border/50 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="container px-4 md:px-6 mx-auto mb-16 relative z-10">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl font-[family-name:var(--font-heading)]">
                        Kata <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Mereka</span>
                    </h2>
                    <p className="max-w-2xl mt-4 text-muted-foreground md:text-lg">
                        Ribuan gamer dan reseller telah mempercayakan kebutuhan Redfinger mereka kepada kami.
                    </p>
                </div>
            </div>

            <div className="relative flex flex-col gap-8 z-10">
                {/* Row 1 - Scroll Left */}
                <div className="flex w-full overflow-hidden [--duration:60s] [--gap:1.5rem] mask-linear-fade">
                    <div className="flex shrink-0 animate-marquee gap-6 py-2 px-4">
                        {row1.map((t, i) => (
                            <TestimonialCard key={`r1a-${i}`} testimonial={t} />
                        ))}
                    </div>
                    <div className="flex shrink-0 animate-marquee gap-6 py-2 px-4" aria-hidden="true">
                        {row1.map((t, i) => (
                            <TestimonialCard key={`r1b-${i}`} testimonial={t} />
                        ))}
                    </div>
                </div>

                {/* Row 2 - Scroll Right */}
                <div className="flex w-full overflow-hidden [--duration:65s] [--gap:1.5rem] mask-linear-fade">
                    <div className="flex shrink-0 animate-marquee-reverse gap-6 py-2 px-4">
                        {row2.map((t, i) => (
                            <TestimonialCard key={`r2a-${i}`} testimonial={t} />
                        ))}
                    </div>
                    <div className="flex shrink-0 animate-marquee-reverse gap-6 py-2 px-4" aria-hidden="true">
                        {row2.map((t, i) => (
                            <TestimonialCard key={`r2b-${i}`} testimonial={t} />
                        ))}
                    </div>
                </div>

                {/* Fading Edges */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-background to-transparent z-20" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-background to-transparent z-20" />
            </div>
        </section>
    )
}

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
    return (
        <div className="w-[280px] md:w-[320px] p-6 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 shadow-sm md:shadow-md shrink-0">
            <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">&quot;{testimonial.content}&quot;</p>
            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {testimonial.avatar}
                </div>
                <div>
                    <div className="font-bold text-sm text-foreground font-[family-name:var(--font-heading)]">{testimonial.name}</div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{testimonial.role}</div>
                </div>
            </div>
        </div>
    )
}
