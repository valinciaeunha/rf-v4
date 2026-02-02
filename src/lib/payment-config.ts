/**
 * Payment Configuration
 * 
 * Centralized configuration for payment settings used by both web and bot.
 */

// Payment timeout in minutes (from env or default 15) - FOR SERVER-SIDE
export const PAYMENT_TIMEOUT_MINUTES = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '15', 10)

// FOR CLIENT-SIDE (React client components) - uses NEXT_PUBLIC_ prefix
export const PAYMENT_TIMEOUT_MINUTES_CLIENT = parseInt(process.env.NEXT_PUBLIC_PAYMENT_TIMEOUT_MINUTES || '15', 10)

// Grace period in minutes before marking as expired via sync (allows API check first)
export const PAYMENT_GRACE_PERIOD_MINUTES = 0

// Polling interval in milliseconds
export const PAYMENT_POLL_INTERVAL_MS = 5000 // 5 seconds

console.log(`[Config] Payment timeout: ${PAYMENT_TIMEOUT_MINUTES} minutes`)
