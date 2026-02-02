"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getSession, hashPassword, verifyPassword } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { profileUpdateSchema, passwordUpdateSchema, validateInput } from "@/lib/validations"

export async function getProfile() {
    const session = await getSession()
    if (!session) return { success: false, error: "Unauthorized" }

    try {
        const user = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                whatsappNumber: users.whatsappNumber,
                discordId: users.discordId,
                avatarUrl: users.discordId, // Placeholder logic, maybe fetch discord avatar later?
            })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1)

        if (user.length === 0) return { success: false, error: "User not found" }

        // Add proper avatar logic if discordId exists, otherwise null
        // For now, let's just return what we have
        const userData = user[0]

        return {
            success: true,
            data: {
                ...userData,
                avatarUrl: null // We don't store avatar URL on DB yet
            }
        }
    } catch (error) {
        console.error("Profile fetch error:", error)
        return { success: false, error: "Gagal memuat profil" }
    }
}

export async function updateProfile(data: { username: string, whatsappNumber: string }) {
    const session = await getSession()
    if (!session) return { success: false, error: "Unauthorized" }

    // Zod Validation
    const validation = validateInput(profileUpdateSchema, data)
    if (!validation.success) {
        return { success: false, error: validation.error }
    }

    try {
        const [updatedUser] = await db.update(users)
            .set({
                username: data.username,
                whatsappNumber: data.whatsappNumber,
                updatedAt: new Date()
            })
            .where(eq(users.id, session.userId))
            .returning({
                id: users.id,
                username: users.username,
                email: users.email,
                whatsappNumber: users.whatsappNumber,
                discordId: users.discordId
            })

        revalidatePath('/profile')
        return { success: true, data: { ...updatedUser, avatarUrl: null } }
    } catch (error) {
        console.error("Profile update error:", error)
        return { success: false, error: "Gagal memperbarui profil" }
    }
}

export async function updatePassword(currentPass: string, newPass: string) {
    const session = await getSession()
    if (!session) return { success: false, error: "Unauthorized" }

    // Zod Validation
    const validation = validateInput(passwordUpdateSchema, {
        currentPassword: currentPass,
        newPassword: newPass,
    })
    if (!validation.success) {
        return { success: false, error: validation.error }
    }

    try {
        // Get current password hash
        const user = await db
            .select({ password: users.password })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1)

        if (user.length === 0 || !user[0].password) {
            return { success: false, error: "User tidak ditemukan atau menggunakan login sosial" }
        }

        const isValid = await verifyPassword(currentPass, user[0].password)
        if (!isValid) {
            return { success: false, error: "Password saat ini salah" }
        }

        const hashed = await hashPassword(newPass)

        await db.update(users)
            .set({ password: hashed, updatedAt: new Date() })
            .where(eq(users.id, session.userId))

        return { success: true }
    } catch (error) {
        console.error("Password update error:", error)
        return { success: false, error: "Gagal mengubah password" }
    }
}
