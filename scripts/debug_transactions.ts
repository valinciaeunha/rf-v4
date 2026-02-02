import { db } from '../src/lib/db'
import { transactions } from '../src/lib/db/schema'
import { desc } from 'drizzle-orm'

async function debug() {
    console.log('--- Recent Transactions ---')
    const recent = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(5)

    recent.forEach(t => {
        console.log(`--- Transaction ${t.id} ---`)
        console.log(`Order ID: ${t.orderId}`)
        console.log(`Method:   ${t.paymentMethod}`)
        console.log(`Status:   ${t.status}`)
        console.log(`Notified: ${t.isNotified}`)
        console.log(`DM MsgID: ${t.dmMessageId}`)
        console.log(`User ID:  ${t.userId}`)
        console.log('---------------------------')
    })
    process.exit(0)
}

debug().catch(e => {
    console.error(e)
    process.exit(1)
})
