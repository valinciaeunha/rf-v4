export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8 font-[family-name:var(--font-heading)]">Kebijakan Privasi</h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>Redfinger.id sangat menghargai privasi Anda. Dokumen ini menjelaskan bagaimana kami mengelola data pribadi Anda.</p>

                <h3 className="text-foreground text-xl font-bold">1. Data yang Kami Kumpulkan</h3>
                <p>Kami hanya mengumpulkan data yang diperlukan untuk proses transaksi, yaitu:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Nomor WhatsApp (untuk konfirmasi pesanan)</li>
                    <li>Alamat Email (opsional, untuk histori pembelian)</li>
                    <li>Bukti Tranfer/Pembayaran</li>
                </ul>

                <h3 className="text-foreground text-xl font-bold">2. Penggunaan Data</h3>
                <p>Data Anda digunakan semata-mata untuk memproses pesanan kode redeem dan memberikan dukungan teknis jika terjadi kendala.</p>

                <h3 className="text-foreground text-xl font-bold">3. Keamanan Data</h3>
                <p>Kami tidak akan pernah menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga manapun.</p>
            </div>
        </div>
    )
}
