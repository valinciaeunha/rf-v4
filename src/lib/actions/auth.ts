'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
    hashPassword,
    verifyPassword,
    createSession,
    getSession,
    deleteSession,
    checkRateLimit,
    resetRateLimit,
} from '@/lib/auth';
import { loginSchema, registerSchema, validateInput } from '@/lib/validations';

// ============== LOGIN ==============
export interface LoginResult {
    success: boolean;
    error?: string;
    code?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
    const rawData = {
        login: formData.get('login') as string,
        password: formData.get('password') as string,
    };

    // Zod Validation
    const validation = validateInput(loginSchema, rawData);
    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    const { login, password } = validation.data;

    // Get IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Rate limit check
    const rateLimit = await checkRateLimit(ip, 'login');
    if (!rateLimit.success) {
        return {
            success: false,
            error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(rateLimit.resetIn / 60)} menit`,
            code: 'RATE_LIMITED',
        };
    }

    // Find user by email or username
    const user = await db
        .select()
        .from(users)
        .where(or(eq(users.email, login), eq(users.username, login)))
        .limit(1);

    if (user.length === 0) {
        return { success: false, error: 'Email atau password salah' };
    }

    const foundUser = user[0];

    // Check if user has password (might be Discord-only)
    if (!foundUser.password) {
        return {
            success: false,
            error: 'Akun ini terdaftar via Discord. Silakan login dengan Discord.',
            code: 'DISCORD_ONLY',
        };
    }

    // Verify password
    const isValid = await verifyPassword(password, foundUser.password);
    if (!isValid) {
        return { success: false, error: 'Email atau password salah' };
    }

    // Reset rate limit on successful login
    await resetRateLimit(ip, 'login');

    // Create session
    await createSession({
        userId: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
        role: foundUser.role,
    });

    return { success: true };
}

// ============== REGISTER ==============
export interface RegisterResult {
    success: boolean;
    error?: string;
    code?: string;
}

export async function registerAction(formData: FormData): Promise<RegisterResult> {
    const rawData = {
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        whatsapp: formData.get('whatsapp') as string || '',
    };

    // Zod Validation
    const validation = validateInput(registerSchema, rawData);
    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    const { username, email, password, whatsapp } = validation.data;

    // Get IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Rate limit check for register (prevent spam registration)
    const rateLimit = await checkRateLimit(ip, 'register');
    if (!rateLimit.success) {
        return {
            success: false,
            error: `Terlalu banyak percobaan registrasi. Coba lagi dalam ${Math.ceil(rateLimit.resetIn / 60)} menit`,
            code: 'RATE_LIMITED',
        };
    }

    // Check if email exists
    const existingEmail = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (existingEmail.length > 0) {
        return { success: false, error: 'Email sudah terdaftar', code: 'EMAIL_EXISTS' };
    }

    // Check if username exists
    const existingUsername = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

    if (existingUsername.length > 0) {
        return { success: false, error: 'Username sudah digunakan', code: 'USERNAME_EXISTS' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const [newUser] = await db
        .insert(users)
        .values({
            username,
            email,
            password: hashedPassword,
            whatsappNumber: whatsapp || null,
        })
        .returning({ id: users.id, email: users.email, username: users.username, role: users.role });

    // Auto-login after register
    await createSession({
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
    });

    // Reset rate limit on successful registration
    await resetRateLimit(ip, 'register');

    return { success: true };
}

// ============== LOGOUT ==============
export async function logoutAction(): Promise<void> {
    await deleteSession();
    redirect('/login');
}

export async function getSessionUser() {
    const session = await getSession();
    if (!session) return null;

    try {
        const user = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                role: users.role,
                balance: users.balance,
                whatsappNumber: users.whatsappNumber,
                discordId: users.discordId,
            })
            .from(users)
            // Ensure session.userId is handled correctly (it should be a number from SessionPayload)
            .where(eq(users.id, session.userId))
            .limit(1);

        if (user.length > 0) {
            return user[0];
        }
    } catch (e) {
        console.error("Failed to fetch fresh user data:", e);
    }

    // Fallback to session data if DB fails or user not found (though rare)
    // Note: SessionPayload might not have all fields like balance
    return {
        id: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
        balance: "0.00", // Default strings for missing fields
        whatsappNumber: null,
        discordId: null
    };
}
