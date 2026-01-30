import { AlertTriangle, Info } from "lucide-react"

export default function RefundPage() {
    return (
        <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8 font-[family-name:var(--font-heading)]">Kebijakan Pengembalian Dana (Refund Policy)</h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-muted-foreground">

                <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 flex gap-4 items-start">
                    <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="text-foreground text-lg font-bold mt-0 mb-2">Penting: Stok Habis Tidak Dapat Refund</h3>
                        <p className="m-0 text-sm">Jika terjadi keterlambatan pengiriman dikarenakan stok kode sedang habis (out of stock) dari pusat, <strong>pembeli tidak dapat mengajukan refund</strong>. Pesanan akan tetap diproses dan dikirimkan segera setelah stok tersedia (sistem pre-order/antrian).</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-foreground text-xl font-bold">Syarat Pengajuan Refund</h3>
                    <p>Pengembalian dana (refund) atau penggantian kode (replacement) HANYA dapat dilakukan jika:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Kode redeem yang diterima <strong>invalid</strong> atau <strong>sudah terpakai</strong> saat pertama kali dicoba. (Wajib menyertakan bukti video screen recording saat input kode).</li>
                        <li>Terjadi kesalahan nominal pengiriman kode dari pihak kami.</li>
                        <li>Layanan Redfinger Global tutup permanen (Force Majeure).</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-foreground text-xl font-bold">Refund Tidak Berlaku Jika:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Pembeli salah membeli varian produk (user error).</li>
                        <li>Pembeli berubah pikiran setelah kode dikirimkan.</li>
                        <li>Akun Redfinger pembeli terkena banned akibat pelanggaran ToS aplikasi.</li>
                        <li>Keterlambatan pengiriman akibat stok habis (seperti dijelaskan di atas).</li>
                    </ul>
                </div>

                <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 flex gap-4 items-center">
                    <Info className="h-6 w-6 text-blue-500 shrink-0" />
                    <p className="m-0 text-sm text-foreground">
                        Proses refund valid akan dikembalikan dalam bentuk <strong>Saldo Akun (Store Balance)</strong> yang dapat digunakan kembali untuk membeli produk lain di website kami. Tidak ada pengembalian uang tunai ke rekening bank/e-wallet.
                    </p>
                </div>

            </div>
        </div>
    )
}
