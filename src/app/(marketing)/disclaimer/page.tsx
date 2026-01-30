export default function DisclaimerPage() {
    return (
        <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8 font-[family-name:var(--font-heading)]">Disclaimer (Penafian)</h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-muted-foreground">

                <h3 className="text-foreground text-xl font-bold">1. Hubungan dengan Redfinger Global</h3>
                <p>Redfinger.id adalah mitra/reseller resmi independen. Kami bukan pemilik, pengembang, atau pengelola langsung aplikasi Redfinger Cloud Phone. Segala kebijakan teknis aplikasi, update, maintenance server, dan banned akun adalah wewenang penuh developer aplikasi (cloudemulator.net).</p>

                <h3 className="text-foreground text-xl font-bold">2. Batasan Tanggung Jawab</h3>
                <p>Redfinger.id bertanggung jawab sebatas penyediaan kode redeem yang valid. Kami tidak bertanggung jawab atas kerugian dalam bentuk apapun yang disebabkan oleh:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Gangguan koneksi internet pengguna.</li>
                    <li>Maintenance server pusat Redfinger.</li>
                    <li>Kesalahan penggunaan aplikasi atau script pihak ketiga oleh pengguna.</li>
                    <li>Kehilangan item/akun game di dalam cloud phone.</li>
                </ul>

            </div>
        </div>
    )
}
