"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Mail, MessageCircle, BookOpen } from "lucide-react"
import Link from "next/link"
import supportData from "./data.json"

export default function SupportPage() {
    // Initialize state with data from data.json
    const [name, setName] = useState(supportData.user.name)
    const [email, setEmail] = useState(supportData.user.email)
    const [categoryId, setCategoryId] = useState(supportData.categories[0].id)
    const [message, setMessage] = useState("")
    const [txId, setTxId] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    // Determine if the selected category requires a Transaction ID
    const selectedCategory = supportData.categories.find(c => c.id === categoryId) || supportData.categories[0]
    const requiresTxId = selectedCategory.requiresTxId

    const handleWhatsAppClick = () => {
        // Extract number from env URL or fallback
        let phoneNumber = "62895411783452"
        const envUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL
        if (envUrl) {
            const match = envUrl.match(/wa\.me\/(\d+)/)
            if (match) {
                phoneNumber = match[1]
            }
        }

        // Build the message
        let text = `*Halo Admin Redfinger ID*\n\nSaya ingin meminta bantuan.\n\n`
        text += `*Nama:* ${name}\n`
        text += `*Email:* ${email}\n`
        text += `*Kategori:* ${selectedCategory.label}\n`

        if (requiresTxId && txId) {
            text += `*ID Transaksi:* ${txId}\n`
        }

        text += `*Pesan:* ${message}\n\n`
        text += `Mohon bantuannya, terima kasih!`

        const encodedText = encodeURIComponent(text)

        window.open(`https://wa.me/${phoneNumber}?text=${encodedText}`, "_blank")
        setIsOpen(false)
    }

    // Validation: Name, Message required. TxID required only if category needs it.
    const isValid = name && message && (!requiresTxId || txId)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* WhatsApp Support with Dynamic Ticket Popup */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Bantuan WhatsApp
                        </CardTitle>
                        <CardDescription>
                            Chat langsung dengan tim support kami untuk bantuan cepat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full">
                                    Chat via WhatsApp
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Kontak Admin WhatsApp</DialogTitle>
                                    <DialogDescription>
                                        Lengkapi formulir di bawah ini agar kami dapat menghubungkan Anda dengan agen yang tepat.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Nama Lengkap</Label>
                                            <Input
                                                id="name"
                                                placeholder="Nama Anda"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Email Anda"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Kategori Masalah</Label>
                                        <select
                                            id="category"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                        >
                                            {supportData.categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {requiresTxId && (
                                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                            <Label htmlFor="txId" className="text-primary font-medium">ID Transaksi / Order ID (Wajib)</Label>
                                            <Input
                                                id="txId"
                                                placeholder="Contoh: INV-12345678"
                                                value={txId}
                                                onChange={(e) => setTxId(e.target.value)}
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                *Masukan ID transaksi dari menu Riwayat Pembelian.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="message">Detail Pesan / Deskripsi</Label>
                                        <textarea
                                            id="message"
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                            placeholder="Jelaskan masalah Anda secara detail..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleWhatsAppClick} disabled={!isValid} className="w-full">
                                        Lanjut ke WhatsApp
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Bantuan Email
                        </CardTitle>
                        <CardDescription>
                            Kirim email untuk pertanyaan detail atau kendala.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full">
                            Kirim Email
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Dokumentasi
                        </CardTitle>
                        <CardDescription>
                            Baca panduan dan tutorial kami untuk menemukan jawaban.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" className="w-full">
                            Lihat Dokumentasi
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* FAQ Section with Clickable Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Pertanyaan Umum (FAQ)</CardTitle>
                    <CardDescription>
                        Jawaban cepat untuk pertanyaan yang sering diajukan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Bagaimana cara membeli kode?</h3>
                        <p className="text-sm text-muted-foreground">
                            Anda dapat membeli kode langsung dari halaman <Link href="/products" className="font-medium text-primary hover:underline">Toko</Link> menggunakan saldo dompet atau metode pembayaran langsung.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Bagaimana cara isi ulang saldo (Top Up)?</h3>
                        <p className="text-sm text-muted-foreground">
                            Buka halaman <Link href="/billing" className="font-medium text-primary hover:underline">Dompet</Link> dan pilih metode pembayaran yang diinginkan untuk menambahkan dana ke akun Anda.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <h3 className="font-semibold">Kode saya tidak berfungsi, apa yang harus saya lakukan?</h3>
                        <p className="text-sm text-muted-foreground">
                            Silakan hubungi tim support kami via WhatsApp dengan menyertakan ID Transaksi dan detail kode untuk bantuan segera.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
