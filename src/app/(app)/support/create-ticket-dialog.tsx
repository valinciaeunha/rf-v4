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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createTicket } from "@/lib/actions/ticket"

export function CreateTicketDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const subject = formData.get("subject") as string
        const priority = formData.get("priority") as "low" | "medium" | "high"
        const message = formData.get("message") as string

        const result = await createTicket({
            subject,
            priority,
            message
        })

        if (result.success && result.data) {
            toast.success("Tiket berhasil dibuat")
            setOpen(false)
            router.push(`/support/${result.data.id}`)
        } else {
            setLoading(false)
            toast.error(result.error || "Gagal membuat tiket")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tiket Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Buat Tiket Baru</DialogTitle>
                        <DialogDescription>
                            Jelaskan masalah Anda. Tim kami akan segera membantu.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subject">Judul</Label>
                            <Input id="subject" name="subject" placeholder="Contoh: Transaksi Gagal" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Prioritas</Label>
                            <Select name="priority" defaultValue="medium">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih prioritas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low (Pertanyaan Umum)</SelectItem>
                                    <SelectItem value="medium">Medium (Kendala Teknis)</SelectItem>
                                    <SelectItem value="high">High (Mendesak/Billing)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Pesan</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Jelaskan detail masalah Anda..."
                                className="min-h-[100px]"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Mengirim..." : "Kirim Tiket"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
