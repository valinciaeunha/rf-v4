import * as dotenv from 'dotenv';
// Load .env.local for scripts (Next.js loads it automatically for the app)
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: '.env.local' });
}

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import Redis from 'ioredis';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

import * as schema from "./schema";

export const db = drizzle(pool, { schema });

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
    globalForRedis.redis ||
    new Redis(process.env.REDIS_URL || 'redis://localhost:6380');

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
