"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getProfile, updateProfile, updatePassword } from "@/lib/actions/user"
import { Skeleton } from "@/components/ui/skeleton"

interface UserType {
    id: number
    username: string
    email: string
    whatsappNumber: string | null
    avatarUrl: string | null
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserType | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [passUpdating, setPassUpdating] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        username: "",
        whatsappNumber: "",
    })

    const [passData, setPassData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const res = await getProfile()
            if (res.success && res.data) {
                setUser(res.data as UserType)
                setFormData({
                    username: res.data.username || "",
                    whatsappNumber: res.data.whatsappNumber || "",
                })
            } else {
                toast.error(res.error || "Gagal memuat profil")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi")
        } finally {
            setLoading(false)
        }
    }

    const handleProfileUpdate = async () => {
        setUpdating(true)
        try {
            const res = await updateProfile(formData)
            if (res.success && res.data) {
                toast.success("Profil berhasil diperbarui")
                setUser(res.data as UserType)
            } else {
                toast.error(res.error || "Gagal memperbarui profil")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan")
        } finally {
            setUpdating(false)
        }
    }

    const handlePasswordUpdate = async () => {
        if (passData.newPassword !== passData.confirmPassword) {
            toast.error("Konfirmasi password tidak cocok")
            return
        }
        if (passData.newPassword.length < 6) {
            toast.error("Password minimal 6 karakter")
            return
        }

        setPassUpdating(true)
        try {
            const res = await updatePassword(passData.currentPassword, passData.newPassword)
            if (res.success) {
                toast.success("Password berhasil diubah")
                setPassData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                })
            } else {
                toast.error(res.error || "Gagal mengubah password")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan")
        } finally {
            setPassUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <div className="grid gap-6">
                    {/* Personal Info Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col gap-6 md:flex-row">
                                <div className="flex flex-col items-center gap-4">
                                    <Skeleton className="h-32 w-32 rounded-full" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Skeleton className="h-10 w-40" />
                        </CardFooter>
                    </Card>

                    {/* Security Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-56" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="grid gap-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Skeleton className="h-10 w-40" />
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Pribadi</CardTitle>
                        <CardDescription>
                            Update detail pribadi dan informasi profil publik anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-6 md:flex-row">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Avatar className="h-32 w-32 border-2 border-border/50">
                                        <AvatarImage src={user?.avatarUrl || ""} alt={user?.username} />
                                        <AvatarFallback className="bg-muted">
                                            <User className="h-12 w-12 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                                        onClick={() => toast.info("Fitur upload avatar akan segera hadir!")}
                                    >
                                        <Camera className="h-4 w-4" />
                                        <span className="sr-only">Change Avatar</span>
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Allowed *.jpeg, *.jpg, *.png, *.gif
                                </p>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username / Nama Lengkap</Label>
                                    <Input
                                        id="username"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={user?.email || ""}
                                            disabled
                                            className="bg-muted"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Nomor WhatsApp</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="0812..."
                                            value={formData.whatsappNumber}
                                            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleProfileUpdate} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Keamanan</CardTitle>
                        <CardDescription>
                            Kelola password dan keamanan akun anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="current-password">Password Saat Ini</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={passData.currentPassword}
                                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">Password Baru</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={passData.newPassword}
                                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={passData.confirmPassword}
                                    onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button variant="outline" onClick={handlePasswordUpdate} disabled={passUpdating}>
                            {passUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
