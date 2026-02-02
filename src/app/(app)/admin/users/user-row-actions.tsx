"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, SquarePen, History, Trash2, Copy, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUser, deleteUser } from "@/lib/actions/admin"
import { UserHistoryDialog } from "./user-history-dialog"

interface UserRowActionsProps {
    user: {
        id: number
        username: string
        email: string
        role: "admin" | "developer" | "user" | "reseller"
        balance: number | string // Handle both
        discordId: string | null
        whatsappNumber: string | null
    }
    sessionRole?: "admin" | "developer" | "user" | "reseller"
}

export function UserRowActions({ user, sessionRole = "admin" }: UserRowActionsProps) {
    const router = useRouter()
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [deleteConfirmUsername, setDeleteConfirmUsername] = useState("")

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.id.toString())
        toast.success("User ID copied to clipboard")
    }

    const handleDelete = async () => {
        if (deleteConfirmUsername !== user.username) {
            toast.error("Username tidak cocok")
            return
        }

        setIsLoading(true)
        const result = await deleteUser(user.id, deleteConfirmUsername)

        if (result.success) {
            toast.success("User berhasil dihapus")
            setShowDeleteDialog(false)
            setDeleteConfirmUsername("")
            router.refresh()
        } else {
            toast.error(result.error || "Gagal menghapus user")
        }
        setIsLoading(false)
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        const data = {
            username: formData.get("username") as string,
            email: formData.get("email") as string,
            role: formData.get("role") as "admin" | "developer" | "user" | "reseller",
            balance: Number(formData.get("balance")),
            discordId: formData.get("discordId") as string,
            whatsappNumber: formData.get("whatsappNumber") as string,
        }

        const result = await updateUser(user.id, data)

        if (result.success) {
            toast.success("User updated successfully")
            setShowEditDialog(false)
            router.refresh()
        } else {
            toast.error(result.error || "Failed to update user")
        }
        setIsLoading(false)
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
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleCopyId}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <SquarePen className="mr-2 h-4 w-4" />
                        Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowHistoryDialog(true)}>
                        <History className="mr-2 h-4 w-4" />
                        View History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {sessionRole === "developer" && (
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Make changes to the user profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    name="username"
                                    defaultValue={user.username}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    defaultValue={user.email}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                    Role
                                </Label>
                                <div className="col-span-3">
                                    <Select name="role" defaultValue={user.role} disabled={isLoading}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="reseller">Reseller</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="developer">Developer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="balance" className="text-right">
                                    Balance
                                </Label>
                                <Input
                                    id="balance"
                                    name="balance"
                                    type="number"
                                    defaultValue={Number(user.balance)}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="whatsappNumber" className="text-right whitespace-nowrap">
                                    WhatsApp
                                </Label>
                                <Input
                                    id="whatsappNumber"
                                    name="whatsappNumber"
                                    defaultValue={user.whatsappNumber || ""}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="discordId" className="text-right">
                                    Discord ID
                                </Label>
                                <Input
                                    id="discordId"
                                    name="discordId"
                                    defaultValue={user.discordId || ""}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <UserHistoryDialog
                userId={user.id}
                open={showHistoryDialog}
                onOpenChange={setShowHistoryDialog}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={(open) => {
                setShowDeleteDialog(open)
                if (!open) setDeleteConfirmUsername("")
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Hapus User
                        </DialogTitle>
                        <DialogDescription>
                            Aksi ini tidak dapat dibatalkan. User akan dinonaktifkan dan data personal akan dianonimkan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
                            <p className="text-sm text-red-800">
                                User: <strong>{user.username}</strong>
                            </p>
                            <p className="text-sm text-red-800">
                                Email: <strong>{user.email}</strong>
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmUsername">
                                Ketik <strong>{user.username}</strong> untuk konfirmasi:
                            </Label>
                            <Input
                                id="confirmUsername"
                                value={deleteConfirmUsername}
                                onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                                placeholder="Ketik username untuk konfirmasi"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading || deleteConfirmUsername !== user.username}
                        >
                            {isLoading ? "Menghapus..." : "Hapus User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
