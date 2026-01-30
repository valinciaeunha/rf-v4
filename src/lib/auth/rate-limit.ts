import { redis } from '@/lib/db';

const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds
const MAX_ATTEMPTS = 5;

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number; // seconds
}

/**
 * Check rate limit for an action (e.g., login attempts)
 * Uses Redis sliding window
 */
export async function checkRateLimit(
    identifier: string,
    action: string
): Promise<RateLimitResult> {
    const key = `rate_limit:${action}:${identifier}`;

    try {
        const current = await redis.incr(key);

        // Set expiry on first attempt
        if (current === 1) {
            await redis.expire(key, RATE_LIMIT_WINDOW);
        }

        const ttl = await redis.ttl(key);
        const remaining = Math.max(0, MAX_ATTEMPTS - current);

        return {
            success: current <= MAX_ATTEMPTS,
            remaining,
            resetIn: ttl > 0 ? ttl : RATE_LIMIT_WINDOW,
        };
    } catch (error) {
        // If Redis fails, allow the request but log
        console.error('Rate limit check failed:', error);
        return { success: true, remaining: MAX_ATTEMPTS, resetIn: 0 };
    }
}

/**
 * Reset rate limit for identifier (e.g., after successful login)
 */
export async function resetRateLimit(identifier: string, action: string): Promise<void> {
    const key = `rate_limit:${action}:${identifier}`;
    await redis.del(key);
}
