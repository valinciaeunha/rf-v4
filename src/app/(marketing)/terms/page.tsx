export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8 font-[family-name:var(--font-heading)]">Syarat & Ketentuan</h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>Selamat datang di Redfinger.id. Harap membaca syarat dan ketentuan ini dengan seksama sebelum melakukan pembelian.</p>

                <h3 className="text-foreground text-xl font-bold">1. Definisi</h3>
                <p>Redfinger.id adalah reseller resmi layanan Redfinger Cloud Phone di Indonesia. Kami menyediakan kode redeem (CDKey) resmi untuk aktivasi layanan cloud phone.</p>

                <h3 className="text-foreground text-xl font-bold">2. Proses Pembelian</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Pembeli wajib memberikan data yang valid (Email/WhatsApp) untuk pengiriman kode.</li>
                    <li>Pembayaran yang sah hanya melalui metode yang tertera di website kami.</li>
                    <li>Kode akan dikirimkan otomatis atau manual oleh admin setelah pembayaran terkonfirmasi.</li>
                </ul>

                <h3 className="text-foreground text-xl font-bold">3. Penggunaan Kode</h3>
                <p>Kode redeem yang dibeli bersifat sekali pakai (one-time use). Pembeli bertanggung jawab sepenuhnya atas keamanan kode setelah diterima. Redfinger.id tidak bertanggung jawab jika kode digunakan oleh orang lain akibat kelalaian pembeli.</p>

                <h3 className="text-foreground text-xl font-bold">4. Perubahan Layanan</h3>
                <p>Redfinger.id berhak mengubah harga sewaktu-waktu mengikuti kebijakan pusat Redfinger Global.</p>
            </div>
        </div>
    )
}
