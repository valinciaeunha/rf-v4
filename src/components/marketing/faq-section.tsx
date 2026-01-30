"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "motion/react"

const faqs = [
    {
        question: "Apa itu Kode Redeem Redfinger?",
        answer: "Kode redeem adalah voucher aktivasi langganan Cloud Phone. Tidak perlu kartu kredit, cukup beli kodenya di sini dan tukarkan di aplikasi Redfinger.",
    },
    {
        question: "Apakah kode ini resmi dan legal?",
        answer: "Ya, kami adalah reseller resmi partner Redfinger Indonesia. Semua kode bersumber langsung dari official, 100% legal, aman, dan bergaransi.",
    },
    {
        question: "Bagaimana cara menerima kodenya?",
        answer: "Sangat cepat! Setelah pembayaran terkonfirmasi, kode voucher akan langsung muncul di halaman transaksi dan dikirimkan otomatis ke WhatsApp serta Email Anda.",
    },
    {
        question: "Apakah ada bantuan aktivasi?",
        answer: "Tentu! Tim Customer Service kami siap membantu 24/7. Jika Anda bingung cara redeem atau ada kendala, hubungi kami via WhatsApp.",
    },
    {
        question: "Berapa lama durasi sewa yang tersedia?",
        answer: "Kami menyediakan berbagai pilihan durasi mulai dari harian, mingguan (7 hari), hingga bulanan (30 hari) untuk paket VIP dan KVIP.",
    },
    {
        question: "Apakah bisa refund?",
        answer: "Kode yang sudah dibeli dan dikirim tidak dapat dikembalikan (non-refundable) karena sifat produk digital. Pastikan Anda memilih paket yang sesuai sebelum membayar.",
    },
]

export function FAQSection() {
    return (
        <section id="faq" className="w-full py-20 md:py-32 bg-background relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl font-[family-name:var(--font-heading)]">
                        Pertanyaan <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">Umum</span>
                    </h2>
                    <p className="max-w-[700px] text-muted-foreground mt-4 md:text-lg">
                        Jawaban terlengkap seputar pembelian dan penggunaan Redfinger.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto"
                >
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border border-border/50 rounded-lg px-2 data-[state=open]:bg-muted/10 data-[state=open]:border-primary/20 transition-all duration-200">
                                <AccordionTrigger className="text-left text-base sm:text-lg font-medium text-foreground hover:no-underline hover:text-primary px-4 py-4">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed text-sm sm:text-base px-4 pb-4">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    )
}
