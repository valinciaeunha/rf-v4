
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Prevent multiple instances in dev mode
        if (process.env.NODE_ENV === 'development' && (global as any).__SYNC_SCHEDULER_STARTED) {
            return
        }

        // Mark as started
        if (process.env.NODE_ENV === 'development') {
            (global as any).__SYNC_SCHEDULER_STARTED = true
        }

        // Start payment sync service
        const { syncPendingPayments } = await import('@/lib/services/sync-service')

        // Run immediately
        syncPendingPayments().catch(console.error)

        // Schedule every minute
        setInterval(async () => {
            try {
                await syncPendingPayments()
            } catch (err) {
                console.error('[Scheduler] Sync failed:', err)
            }
        }, 60 * 1000)

        // Discord bot runs separately via: npm run bot:start
        // This avoids bundling issues with Next.js Turbopack
    }
}
