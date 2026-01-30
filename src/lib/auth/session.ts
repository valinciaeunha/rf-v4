import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET || 'fallback-secret-change-in-production'
);
const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
    userId: number;
    email: string;
    username: string;
    role: string;
}

/**
 * Create and set session cookie
 */
export async function createSession(payload: SessionPayload): Promise<void> {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION}s`)
        .sign(SESSION_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, SESSION_SECRET);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

/**
 * Delete session cookie (logout)
 */
export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
