"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createProduct } from "@/lib/actions/admin-products"

export function AddProductDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        productId: "",
        name: "",
        price: "",
        buyPrice: "",
        expiredDays: "30",
        type: "manual" as "instant" | "manual",
        badge: "",
        status: "active" as "active" | "inactive",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createProduct({
                productId: formData.productId,
                name: formData.name,
                price: parseFloat(formData.price) || 0,
                buyPrice: parseFloat(formData.buyPrice) || 0,
                expiredDays: parseInt(formData.expiredDays) || 30,
                type: formData.type,
                badge: formData.badge || null,
                status: formData.status,
            })

            if (result.success) {
                toast.success("Produk berhasil ditambahkan")
                setOpen(false)
                setFormData({
                    productId: "",
                    name: "",
                    price: "",
                    buyPrice: "",
                    expiredDays: "30",
                    type: "manual",
                    badge: "",
                    status: "active",
                })
                router.refresh()
            } else {
                toast.error(result.error || "Gagal menambahkan produk")
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
                    Tambah Produk
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Tambah Produk Baru</DialogTitle>
                        <DialogDescription>
                            Isi informasi produk di bawah ini
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="productId">Product ID</Label>
                            <Input
                                id="productId"
                                placeholder="contoh: RF-CLOUD-30D"
                                value={formData.productId}
                                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Produk</Label>
                            <Input
                                id="name"
                                placeholder="contoh: RedFinger Cloud 30 Hari"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Harga Jual</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="buyPrice">Harga Beli</Label>
                                <Input
                                    id="buyPrice"
                                    type="number"
                                    placeholder="0"
                                    value={formData.buyPrice}
                                    onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipe</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v: "instant" | "manual") => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="instant">Instant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="expiredDays">Masa Aktif (Hari)</Label>
                                <Input
                                    id="expiredDays"
                                    type="number"
                                    value={formData.expiredDays}
                                    onChange={(e) => setFormData({ ...formData, expiredDays: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="badge">Badge (Opsional)</Label>
                                <Input
                                    id="badge"
                                    placeholder="contoh: Promo"
                                    value={formData.badge}
                                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v: "active" | "inactive") => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
