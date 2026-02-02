"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { addStock } from "@/lib/actions/admin-stocks"
import { useRouter } from "next/navigation"

interface AddStockDialogProps {
    productId: number
    productName: string
}

export function AddStockDialog({ productId, productName }: AddStockDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [codes, setCodes] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await addStock(productId, codes)

            if (result.success) {
                toast.success(result.message || `Berhasil menambahkan ${result.count} stock`)
                setOpen(false)
                setCodes("")
                router.refresh()
            } else {
                toast.error(result.error || "Gagal menambahkan stock")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Stock
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Tambah Stock</DialogTitle>
                        <DialogDescription>
                            Tambahkan kode stock untuk <strong>{productName}</strong>.
                            Pisahkan dengan baris baru (enter) untuk menambahkan banyak sekaligus.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-2">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="codes">Kode Stock</Label>
                                <Textarea
                                    id="codes"
                                    placeholder="AAAAAAAA&#10;BBBBBBBB&#10;CCCCCCCC"
                                    value={codes}
                                    onChange={(e) => setCodes(e.target.value)}
                                    className="min-h-[200px] font-mono resize-none focus-visible:ring-0"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    {codes.split('\n').filter(c => c.trim().length > 0).length} kode terdeteksi
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading || !codes.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
