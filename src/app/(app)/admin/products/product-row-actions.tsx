"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { MoreHorizontal, Pencil, Trash2, Loader2, Settings, GripVertical, Plus, Cpu, MemoryStick, HardDrive, Monitor, Clock, Check, Star, Zap, Shield, Globe, Package, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { updateProduct, deleteProduct, getProductById, addProductSpecification, updateProductSpecification, deleteProductSpecification } from "@/lib/actions/admin-products"
import { Switch } from "@/components/ui/switch"

interface Product {
    id: number
    productId: string
    name: string
    price: string
    buyPrice: string
    expiredDays: number
    type: "instant" | "manual"
    badge: string | null
    status: "active" | "inactive" | null
}

interface Specification {
    id: number
    iconType: string
    label: string
    displayOrder: number
    isActive: boolean
}

const iconTypes: { value: string; label: string; icon: LucideIcon }[] = [
    { value: "cpu", label: "CPU", icon: Cpu },
    { value: "ram", label: "RAM", icon: MemoryStick },
    { value: "storage", label: "Storage", icon: HardDrive },
    { value: "display", label: "Display", icon: Monitor },
    { value: "clock", label: "Clock", icon: Clock },
    { value: "check", label: "Check", icon: Check },
    { value: "star", label: "Star", icon: Star },
    { value: "zap", label: "Zap", icon: Zap },
    { value: "shield", label: "Shield", icon: Shield },
    { value: "globe", label: "Globe", icon: Globe },
]

const getIconByType = (iconType: string) => {
    const found = iconTypes.find((i) => i.value === iconType)
    return found ? found.icon : Check
}

function SpecificationsDialog({
    open,
    onOpenChange,
    product
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: Product
}) {
    const [loading, setLoading] = useState(false)
    const [specifications, setSpecifications] = useState<Specification[]>([])
    const [newSpec, setNewSpec] = useState({ iconType: "check", label: "" })

    useEffect(() => {
        if (open) fetchSpecifications()
    }, [open])

    const fetchSpecifications = async () => {
        setLoading(true)
        try {
            const result = await getProductById(product.id)
            if (result.success && result.data) {
                setSpecifications(result.data.specifications || [])
            }
        } catch (error) {
            console.error("Failed to fetch specifications:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async () => {
        if (!newSpec.label.trim()) return
        setLoading(true)
        try {
            const result = await addProductSpecification(product.id, {
                iconType: newSpec.iconType,
                label: newSpec.label,
                displayOrder: specifications.length,
                isActive: true,
            })
            if (result.success) {
                toast.success("Spesifikasi ditambahkan")
                setNewSpec({ iconType: "check", label: "" })
                await fetchSpecifications()
            } else {
                toast.error(result.error || "Gagal menambahkan")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (id: number, data: Partial<Specification>) => {
        const result = await updateProductSpecification(id, data)
        if (result.success) {
            toast.success("Spesifikasi diupdate")
            await fetchSpecifications()
        } else {
            toast.error(result.error || "Gagal mengupdate")
        }
    }

    const handleDelete = async (id: number) => {
        const result = await deleteProductSpecification(id)
        if (result.success) {
            toast.success("Spesifikasi dihapus")
            await fetchSpecifications()
        } else {
            toast.error(result.error || "Gagal menghapus")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Spesifikasi Produk</DialogTitle>
                    <DialogDescription>
                        Kelola spesifikasi untuk {product.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* Add new */}
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <h4 className="font-medium text-sm">Tambah Spesifikasi Baru</h4>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                                <Select value={newSpec.iconType} onValueChange={(v: string) => setNewSpec({ ...newSpec, iconType: v })}>
                                    <SelectTrigger className="w-full">
                                        {(() => { const Icon = getIconByType(newSpec.iconType); return <Icon className="h-4 w-4 mr-1" /> })()}
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {iconTypes.map((i) => (
                                            <SelectItem key={i.value} value={i.value}>
                                                <span className="flex items-center gap-2">
                                                    <i.icon className="h-4 w-4" />
                                                    {i.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-7">
                                <Input placeholder="contoh: RAM 4GB" value={newSpec.label} onChange={(e) => setNewSpec({ ...newSpec, label: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
                            </div>
                            <div className="col-span-2">
                                <Button onClick={handleAdd} disabled={loading || !newSpec.label.trim()} className="w-full" size="sm"><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                    {/* List */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Spesifikasi ({specifications.length})</h4>
                        {loading && specifications.length === 0 ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : specifications.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">Belum ada spesifikasi</div>
                        ) : (
                            <div className="space-y-2">
                                {specifications.map((spec) => (
                                    <div key={spec.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                                        {(() => { const Icon = getIconByType(spec.iconType); return <Icon className="h-5 w-5 text-muted-foreground shrink-0" /> })()}
                                        <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                                            <div className="col-span-3">
                                                <Select value={spec.iconType} onValueChange={(v: string) => handleUpdate(spec.id, { iconType: v })}>
                                                    <SelectTrigger className="w-full h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {iconTypes.map((i) => (
                                                            <SelectItem key={i.value} value={i.value}>
                                                                <span className="flex items-center gap-2">
                                                                    <i.icon className="h-4 w-4" />
                                                                    {i.label}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-6">
                                                <Input className="h-8 text-xs" value={spec.label} onChange={(e) => handleUpdate(spec.id, { label: e.target.value })} />
                                            </div>
                                            <div className="col-span-2 flex items-center justify-center">
                                                <Switch checked={spec.isActive} onCheckedChange={(v: boolean) => handleUpdate(spec.id, { isActive: v })} />
                                            </div>
                                            <div className="col-span-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(spec.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div >
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ProductRowActions({ product }: { product: Product }) {
    const router = useRouter()
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [specsOpen, setSpecsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        productId: product.productId,
        name: product.name,
        price: product.price,
        buyPrice: product.buyPrice,
        expiredDays: String(product.expiredDays),
        type: product.type,
        badge: product.badge || "",
        status: product.status || "active",
    })

    const [confirmPassword, setConfirmPassword] = useState("")

    const handleDelete = async () => {
        if (!confirmPassword) {
            toast.error("Password wajib diisi")
            return
        }
        setLoading(true)
        try {
            const result = await deleteProduct(product.id, confirmPassword)
            if (result.success) {
                toast.success("Produk berhasil dihapus")
                setDeleteOpen(false)
                setConfirmPassword("")
                router.refresh()
            } else {
                toast.error(result.error || "Gagal menghapus produk")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateProduct(product.id, {
                productId: formData.productId,
                name: formData.name,
                price: parseFloat(formData.price) || 0,
                buyPrice: parseFloat(formData.buyPrice) || 0,
                expiredDays: parseInt(formData.expiredDays) || 30,
                type: formData.type as "instant" | "manual",
                badge: formData.badge || null,
                status: formData.status as "active" | "inactive",
            })

            if (result.success) {
                toast.success("Produk berhasil diupdate")
                setEditOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || "Gagal mengupdate produk")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSpecsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Spesifikasi
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}/stocks`} className="flex items-center w-full cursor-pointer">
                            <Package className="mr-2 h-4 w-4" />
                            Stocks
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeleteOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Dialog with Password */}
            <Dialog open={deleteOpen} onOpenChange={(val) => {
                setDeleteOpen(val)
                if (!val) setConfirmPassword("")
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Hapus Produk?</DialogTitle>
                        <DialogDescription>
                            Produk <strong>"{product.name}"</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="delete-password">Konfirmasi Password Admin</Label>
                            <Input
                                id="delete-password"
                                type="password"
                                placeholder="Masukkan password Anda"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading || !confirmPassword}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus Produk
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Edit Produk</DialogTitle>
                            <DialogDescription>
                                Ubah informasi produk di bawah ini
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-productId">Product ID</Label>
                                <Input
                                    id="edit-productId"
                                    value={formData.productId}
                                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nama Produk</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-price">Harga Jual</Label>
                                    <Input
                                        id="edit-price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-buyPrice">Harga Beli</Label>
                                    <Input
                                        id="edit-buyPrice"
                                        type="number"
                                        value={formData.buyPrice}
                                        onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-type">Tipe</Label>
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
                                    <Label htmlFor="edit-expiredDays">Masa Aktif (Hari)</Label>
                                    <Input
                                        id="edit-expiredDays"
                                        type="number"
                                        value={formData.expiredDays}
                                        onChange={(e) => setFormData({ ...formData, expiredDays: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-badge">Badge</Label>
                                    <Input
                                        id="edit-badge"
                                        value={formData.badge}
                                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-status">Status</Label>
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
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
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

            {/* Specifications Dialog */}
            <SpecificationsDialog
                open={specsOpen}
                onOpenChange={setSpecsOpen}
                product={product}
            />
        </>
    )
}
