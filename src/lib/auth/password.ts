import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
