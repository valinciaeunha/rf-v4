import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// SECURITY: Session secret MUST be set in environment
// Minimum 32 characters for security
// Uses lazy initialization to allow static analysis/build to complete
let _sessionSecret: Uint8Array | null = null;

function getSessionSecret(): Uint8Array {
    if (_sessionSecret) return _sessionSecret;

    const rawSecret = process.env.SESSION_SECRET;
    if (!rawSecret) {
        throw new Error('FATAL: SESSION_SECRET environment variable is not set. Application cannot start securely.');
    }
    if (rawSecret.length < 32) {
        throw new Error('FATAL: SESSION_SECRET must be at least 32 characters long for security.');
    }

    _sessionSecret = new TextEncoder().encode(rawSecret);
    return _sessionSecret;
}

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
        .sign(getSessionSecret());

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
        const { payload } = await jwtVerify(token, getSessionSecret());
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
