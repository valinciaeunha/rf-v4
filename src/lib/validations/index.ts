import { z } from "zod"

// ============== Auth Schemas ==============
export const loginSchema = z.object({
    login: z.string()
        .min(1, "Email atau username wajib diisi")
        .max(255, "Terlalu panjang"),
    password: z.string()
        .min(1, "Password wajib diisi")
        .max(128, "Password terlalu panjang"),
})

export const registerSchema = z.object({
    username: z.string()
        .min(3, "Username minimal 3 karakter")
        .max(50, "Username maksimal 50 karakter")
        .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
    email: z.string()
        .email("Format email tidak valid")
        .max(255, "Email terlalu panjang"),
    password: z.string()
        .min(8, "Password minimal 8 karakter")
        .max(128, "Password terlalu panjang"),
    whatsapp: z.string()
        .regex(/^(\+62|62|0)?8[1-9][0-9]{7,11}$/, "Format WhatsApp tidak valid")
        .optional()
        .or(z.literal("")),
})

// ============== User Schemas ==============
export const profileUpdateSchema = z.object({
    username: z.string()
        .min(3, "Username minimal 3 karakter")
        .max(50, "Username maksimal 50 karakter")
        .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
    whatsappNumber: z.string()
        .regex(/^(\+62|62|0)?8[1-9][0-9]{7,11}$/, "Format WhatsApp tidak valid")
        .optional()
        .or(z.literal("")),
})

export const passwordUpdateSchema = z.object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string()
        .min(8, "Password baru minimal 8 karakter")
        .max(128, "Password terlalu panjang"),
})

// ============== Wallet Schemas ==============
export const topUpSchema = z.object({
    amount: z.number()
        .min(1000, "Minimal top up Rp1.000")
        .max(10000000, "Maksimal top up Rp10.000.000"),
    paymentMethod: z.string().min(1, "Metode pembayaran wajib dipilih"),
})

// ============== Order Schemas ==============
export const orderSchema = z.object({
    productId: z.number().positive("Product ID tidak valid"),
    quantity: z.number()
        .int("Quantity harus bilangan bulat")
        .min(1, "Minimal 1 item")
        .max(100, "Maksimal 100 item"),
    paymentMethod: z.string().min(1, "Metode pembayaran wajib dipilih"),
    email: z.string().email().optional(),
    whatsappNumber: z.string().optional(),
})

// ============== Admin Schemas ==============
export const adminUserUpdateSchema = z.object({
    username: z.string()
        .min(3, "Username minimal 3 karakter")
        .max(50, "Username maksimal 50 karakter"),
    email: z.string()
        .email("Format email tidak valid")
        .max(255),
    role: z.enum(["user", "reseller", "admin", "developer"], {
        message: "Role tidak valid",
    }),
    balance: z.number()
        .min(0, "Balance tidak boleh negatif"),
    discordId: z.string().max(50).optional().or(z.literal("")),
    whatsappNumber: z.string().max(50).optional().or(z.literal("")),
})

export const adminDeleteUserSchema = z.object({
    userId: z.number().positive("User ID tidak valid"),
    confirmUsername: z.string().min(1, "Konfirmasi username wajib diisi"),
})

// ============== Validation Helper ==============
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true
    data: T
} | {
    success: false
    error: string
    errors?: z.ZodIssue[]
} {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return {
        success: false,
        error: result.error.issues[0]?.message || "Validasi gagal",
        errors: result.error.issues,
    }
}

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type TopUpInput = z.infer<typeof topUpSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>
