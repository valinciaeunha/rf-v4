
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"

async function importReviews() {
    console.log("Starting review import...")

    const reviewData = [
        { id: 5, publicId: '441e316b45382e1c6f51c74e6ed09c2a', userId: 6, transactionId: 47, productId: 1, rating: 5, reviewText: '2', createdAt: new Date('2025-10-13 15:22:53'), updatedAt: new Date('2025-10-17 01:11:06') },
        { id: 6, publicId: '984219a7db6027b91d53c68912ae4de3', userId: 6, transactionId: 48, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-13 15:45:18'), updatedAt: new Date('2025-10-17 01:11:06') },
        { id: 7, publicId: 'ce862c83945352ce194bc7d2662c7c4c', userId: 80, transactionId: 185, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-14 10:37:48'), updatedAt: new Date('2025-10-17 01:11:06') },
        { id: 8, publicId: '6f36e816bbc94a23937c26ff9c51a787', userId: 18, transactionId: 229, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-15 02:09:31'), updatedAt: new Date('2025-10-17 01:11:06') },
        { id: 11, publicId: '49c7d1616edccc5896ce9f275c32fa55', userId: 6, transactionId: 49, productId: 1, rating: 5, reviewText: 'Damn bro', createdAt: new Date('2025-10-16 19:17:22'), updatedAt: new Date('2025-10-17 01:11:06') },
        { id: 12, publicId: 'ba9fbf889ca2c318c21570f47778a157', userId: 6, transactionId: 53, productId: 2, rating: 5, reviewText: 'Syuuuu', createdAt: new Date('2025-10-16 19:17:36'), updatedAt: new Date('2025-10-17 01:11:06') },
        { id: 14, publicId: null, userId: 28, transactionId: 522, productId: 2, rating: 5, reviewText: 'haha', createdAt: new Date('2025-10-17 01:25:28'), updatedAt: new Date('2025-10-17 01:25:28') },
        { id: 15, publicId: null, userId: 308, transactionId: 629, productId: 1, rating: 5, reviewText: 'Mantap', createdAt: new Date('2025-10-17 02:48:51'), updatedAt: new Date('2025-10-17 02:48:51') },
        { id: 16, publicId: null, userId: 28, transactionId: 659, productId: 1, rating: 5, reviewText: 'amanah', createdAt: new Date('2025-10-17 05:40:27'), updatedAt: new Date('2025-10-17 05:40:27') },
        { id: 17, publicId: null, userId: 14, transactionId: 242, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-17 14:14:24'), updatedAt: new Date('2025-10-17 14:14:24') },
        { id: 18, publicId: null, userId: 14, transactionId: 226, productId: 2, rating: 5, reviewText: '', createdAt: new Date('2025-10-17 14:14:28'), updatedAt: new Date('2025-10-17 14:14:28') },
        { id: 19, publicId: null, userId: 28, transactionId: 793, productId: 1, rating: 5, reviewText: 'kikir', createdAt: new Date('2025-10-17 14:55:00'), updatedAt: new Date('2025-10-17 14:55:00') },
        { id: 20, publicId: null, userId: 392, transactionId: 840, productId: 1, rating: 5, reviewText: 'Icikiwir langsung satset', createdAt: new Date('2025-10-17 17:06:32'), updatedAt: new Date('2025-10-17 17:06:32') },
        { id: 21, publicId: null, userId: 395, transactionId: 846, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-17 19:02:25'), updatedAt: new Date('2025-10-17 19:02:25') },
        { id: 22, publicId: null, userId: 403, transactionId: 858, productId: 1, rating: 4, reviewText: '', createdAt: new Date('2025-10-18 01:09:34'), updatedAt: new Date('2025-10-18 01:09:34') },
        { id: 23, publicId: null, userId: 447, transactionId: 982, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-18 10:52:32'), updatedAt: new Date('2025-10-18 10:52:32') },
        { id: 24, publicId: null, userId: 41, transactionId: 983, productId: 1, rating: 5, reviewText: 'Ah mantap🗿👍', createdAt: new Date('2025-10-18 11:10:46'), updatedAt: new Date('2025-10-18 11:10:46') },
        { id: 25, publicId: null, userId: 250, transactionId: 1021, productId: 2, rating: 5, reviewText: 'gathcor', createdAt: new Date('2025-10-18 13:06:45'), updatedAt: new Date('2025-10-18 13:06:45') },
        { id: 26, publicId: null, userId: 215, transactionId: 1035, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-18 13:49:32'), updatedAt: new Date('2025-10-18 13:49:32') },
        { id: 27, publicId: null, userId: 481, transactionId: 1108, productId: 1, rating: 5, reviewText: 'RF TERBAIK', createdAt: new Date('2025-10-19 02:12:47'), updatedAt: new Date('2025-10-19 02:12:47') },
        { id: 28, publicId: null, userId: 446, transactionId: 980, productId: 1, rating: 5, reviewText: 'gacor king', createdAt: new Date('2025-10-19 21:32:43'), updatedAt: new Date('2025-10-19 21:32:43') },
        { id: 29, publicId: null, userId: 221, transactionId: 1419, productId: 2, rating: 5, reviewText: '', createdAt: new Date('2025-10-20 04:14:35'), updatedAt: new Date('2025-10-20 04:14:35') },
        { id: 30, publicId: null, userId: 579, transactionId: 1430, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-20 05:32:31'), updatedAt: new Date('2025-10-20 05:32:31') },
        { id: 31, publicId: null, userId: 391, transactionId: 1597, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-21 02:15:26'), updatedAt: new Date('2025-10-21 02:15:26') },
        { id: 32, publicId: null, userId: 502, transactionId: 1659, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-21 03:14:24'), updatedAt: new Date('2025-10-21 03:14:24') },
        { id: 33, publicId: null, userId: 660, transactionId: 1660, productId: 1, rating: 5, reviewText: 'mantap min', createdAt: new Date('2025-10-21 03:15:15'), updatedAt: new Date('2025-10-21 03:15:15') },
        { id: 34, publicId: null, userId: 682, transactionId: 1764, productId: 1, rating: 5, reviewText: 'GG BANG, TAPI STOK ANDROID 12 NYA DI RF ABIS🥲', createdAt: new Date('2025-10-21 10:16:17'), updatedAt: new Date('2025-10-21 10:16:17') },
        { id: 35, publicId: null, userId: 914, transactionId: 1826, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 01:59:45'), updatedAt: new Date('2025-10-22 01:59:45') },
        { id: 36, publicId: null, userId: 1026, transactionId: 1875, productId: 2, rating: 5, reviewText: 'Nais', createdAt: new Date('2025-10-22 02:06:31'), updatedAt: new Date('2025-10-22 02:06:31') },
        { id: 37, publicId: null, userId: 1002, transactionId: 1830, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 02:48:47'), updatedAt: new Date('2025-10-22 02:48:47') },
        { id: 38, publicId: null, userId: 1099, transactionId: 1983, productId: 1, rating: 5, reviewText: 'Baru pertama kali beli kek gini, dan hasilnya memuaskan', createdAt: new Date('2025-10-22 04:58:54'), updatedAt: new Date('2025-10-22 04:58:54') },
        { id: 39, publicId: null, userId: 1104, transactionId: 1990, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 05:47:05'), updatedAt: new Date('2025-10-22 05:47:05') },
        { id: 40, publicId: null, userId: 41, transactionId: 2051, productId: 2, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 09:04:14'), updatedAt: new Date('2025-10-22 09:04:14') },
        { id: 41, publicId: null, userId: 1214, transactionId: 2086, productId: 2, rating: 5, reviewText: 'sangatt fastt', createdAt: new Date('2025-10-22 09:19:14'), updatedAt: new Date('2025-10-22 09:19:14') },
        { id: 42, publicId: null, userId: 1203, transactionId: 2082, productId: 2, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 09:19:39'), updatedAt: new Date('2025-10-22 09:19:39') },
        { id: 43, publicId: null, userId: 20, transactionId: 2094, productId: 2, rating: 5, reviewText: 'goks - himang_dg', createdAt: new Date('2025-10-22 09:29:47'), updatedAt: new Date('2025-10-22 09:29:47') },
        { id: 44, publicId: null, userId: 1203, transactionId: 2104, productId: 2, rating: 5, reviewText: 'fast', createdAt: new Date('2025-10-22 09:33:54'), updatedAt: new Date('2025-10-22 09:33:54') },
        { id: 45, publicId: null, userId: 1203, transactionId: 2119, productId: 2, rating: 5, reviewText: 'gass', createdAt: new Date('2025-10-22 09:42:39'), updatedAt: new Date('2025-10-22 09:42:39') },
        { id: 46, publicId: null, userId: 1344, transactionId: 2160, productId: 2, rating: 5, reviewText: 'mantap, aku dapet pap bugil dio', createdAt: new Date('2025-10-22 14:58:14'), updatedAt: new Date('2025-10-22 14:58:14') },
        { id: 47, publicId: null, userId: 14, transactionId: 2184, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 15:18:38'), updatedAt: new Date('2025-10-22 15:18:38') },
        { id: 48, publicId: null, userId: 14, transactionId: 2183, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 15:18:42'), updatedAt: new Date('2025-10-22 15:18:42') },
        { id: 49, publicId: null, userId: 1352, transactionId: 2189, productId: 2, rating: 5, reviewText: 'mantep proses nya cepet', createdAt: new Date('2025-10-22 15:30:47'), updatedAt: new Date('2025-10-22 15:30:47') },
        { id: 50, publicId: null, userId: 1352, transactionId: 2187, productId: 1, rating: 5, reviewText: 'mantep prosesnya cepet', createdAt: new Date('2025-10-22 15:30:59'), updatedAt: new Date('2025-10-22 15:30:59') },
        { id: 51, publicId: null, userId: 1366, transactionId: 2188, productId: 1, rating: 5, reviewText: 'mantap minnn', createdAt: new Date('2025-10-22 15:32:04'), updatedAt: new Date('2025-10-22 15:32:04') },
        { id: 52, publicId: null, userId: 1337, transactionId: 2194, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 16:07:23'), updatedAt: new Date('2025-10-22 16:07:23') },
        { id: 53, publicId: null, userId: 1376, transactionId: 2215, productId: 1, rating: 5, reviewText: 'Nice kawan', createdAt: new Date('2025-10-22 16:08:44'), updatedAt: new Date('2025-10-22 16:08:44') },
        { id: 54, publicId: null, userId: 1266, transactionId: 2229, productId: 1, rating: 5, reviewText: '', createdAt: new Date('2025-10-22 17:01:21'), updatedAt: new Date('2025-10-22 17:01:21') }
    ]

    try {
        for (const data of reviewData) {
            await db.insert(reviews).values(data).onConflictDoNothing()
        }
        console.log("Reviews imported successfully!")
    } catch (error) {
        console.error("Error importing reviews:", error)
    }
}

importReviews()
