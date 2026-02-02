
import fs from 'fs'
import path from 'path'
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"

async function importDirectFromSql() {
    const sqlFilePath = path.join(process.cwd(), 'redfing1_db (7).sql')
    console.log(`Reading SQL file: ${sqlFilePath}...`)

    if (!fs.existsSync(sqlFilePath)) {
        console.error("File SQL tidak ditemukan!")
        return
    }

    const content = fs.readFileSync(sqlFilePath, 'utf8')

    // Cari semua bagian INSERT INTO `reviews`
    // Gunakan regex global 'g'
    const insertRegex = /INSERT INTO `reviews` \([^)]+\) VALUES\s*([\s\S]+?);/g
    let match
    let totalImported = 0
    let totalFound = 0

    console.log("Searching for INSERT statements...")

    while ((match = insertRegex.exec(content)) !== null) {
        const valuesBlock = match[1]
        // Regex untuk memisahkan setiap baris data ( row )
        // Berhati-hati dengan string yang mengandung ), (
        // Split by "), (" is usually safe in these dumps
        const rows = valuesBlock.split(/\),\s*\(/)
        totalFound += rows.length

        for (let row of rows) {
            try {
                // Clean up row string
                row = row.trim()
                if (row.startsWith('(')) row = row.substring(1)
                if (row.endsWith(')')) row = row.substring(0, row.length - 1)

                // Parser simple yang lebih kuat
                // Menangani NULL, angka, dan string ber-quote
                const parts: string[] = []
                let current = ""
                let inString = false
                for (let i = 0; i < row.length; i++) {
                    const char = row[i]
                    if (char === "'" && (i === 0 || row[i - 1] !== "\\")) {
                        inString = !inString
                    } else if (char === "," && !inString) {
                        parts.push(current.trim())
                        current = ""
                    } else {
                        current += char
                    }
                }
                parts.push(current.trim())

                if (parts.length < 9) continue

                const clean = (val: string) => {
                    if (val === 'NULL' || val === 'null') return null
                    if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1)
                    return val
                }

                const data = {
                    id: parseInt(parts[0]),
                    publicId: clean(parts[1]),
                    userId: parseInt(parts[2]),
                    transactionId: parseInt(parts[3]),
                    productId: parseInt(parts[4]),
                    rating: parseInt(parts[5]),
                    reviewText: clean(parts[6]),
                    createdAt: new Date(clean(parts[7]) || Date.now()),
                    updatedAt: new Date(clean(parts[8]) || Date.now())
                }

                // Cek validitas date
                if (isNaN(data.createdAt.getTime())) data.createdAt = new Date()
                if (isNaN(data.updatedAt.getTime())) data.updatedAt = new Date()

                await db.insert(reviews).values(data).onConflictDoNothing()
                totalImported++
            } catch (err: any) {
                // Hanya log jika bukan foreign key error agar tidak banjir
                if (!err.message?.includes('foreign key constraint')) {
                    // console.error(`Unexpected error for row: ${row.slice(0, 50)}...`, err.message)
                }
            }
        }
        console.log(`Processed a block... Total successfully imported so far: ${totalImported}`)
    }

    console.log(`✅ Selesai!`)
    console.log(`- Total baris ditemukan di SQL: ${totalFound}`)
    console.log(`- Total berhasil masuk DB: ${totalImported}`)
    console.log(`(Selisih biasanya karena User ID atau Product ID tidak ditemukan di DB baru)`)
}

importDirectFromSql().catch(console.error)
