
import fs from 'fs';
import readline from 'readline';
import { db } from '../src/lib/db';
import { deposits, transactions } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

const SQL_FILE_PATH = 'redfing1_db (7).sql';

async function migrate() {
    console.log('Starting migration...');

    if (!fs.existsSync(SQL_FILE_PATH)) {
        console.error(`File not found: ${SQL_FILE_PATH}`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let isDeposits = false;
    let isTransactions = false;
    let columns: string[] = [];

    const BATCH_SIZE = 1000;
    let depositsBatch: any[] = [];
    let transactionsBatch: any[] = [];

    let lineCount = 0;

    for await (const line of rl) {
        lineCount++;
        const trimmedLine = line.trim();

        // Debug: Log first few lines to check format
        if (lineCount <= 3) {
            console.log(`[DEBUG] Line ${lineCount}: ${trimmedLine.substring(0, 50)}...`);
        }

        if (trimmedLine.startsWith('INSERT INTO `deposits`')) {
            console.log(`[INFO] Found deposits insert at line ${lineCount}`);
            isDeposits = true;
            isTransactions = false;
            const match = line.match(/`deposits` \((.*?)\)/);
            if (match) {
                columns = match[1].split(',').map(c => c.trim().replace(/`/g, ''));
            }
        } else if (trimmedLine.startsWith('INSERT INTO `transactions`')) {
            console.log(`[INFO] Found transactions insert at line ${lineCount}`);
            isTransactions = true;
            isDeposits = false;
            const match = line.match(/`transactions` \((.*?)\)/);
            if (match) {
                columns = match[1].split(',').map(c => c.trim().replace(/`/g, ''));
            }
        } else if (trimmedLine.startsWith('INSERT INTO')) {
            // Reset if we hit another table
            isDeposits = false;
            isTransactions = false;
        }

        if (isDeposits || isTransactions) {
            const valuesIndex = line.indexOf('VALUES');
            if (valuesIndex === -1) continue;

            const valuesPart = line.substring(valuesIndex + 6).trim();
            const cleanValues = valuesPart.endsWith(';') ? valuesPart.slice(0, -1) : valuesPart;

            let currentTuple = '';
            let inParen = 0;
            let inQuote = false;

            for (let i = 0; i < cleanValues.length; i++) {
                const char = cleanValues[i];
                if (char === "'" && cleanValues[i - 1] !== '\\') {
                    inQuote = !inQuote;
                }
                if (!inQuote) {
                    if (char === '(') inParen++;
                    if (char === ')') inParen--;
                }

                currentTuple += char;

                if (inParen === 0 && char === ')' && !inQuote) {
                    const inner = currentTuple.trim();
                    const tupleContent = inner.replace(/^\s*,?\s*\(/, '').replace(/\)$/, '');

                    // Helper to parse CSV respecting quotes
                    const parseCSV = (str: string) => {
                        const res = [];
                        let cur = '';
                        let inQ = false;
                        for (let j = 0; j < str.length; j++) {
                            const c = str[j];
                            if (c === "'" && str[j - 1] !== '\\') inQ = !inQ;
                            if (c === ',' && !inQ) {
                                res.push(cur.trim());
                                cur = '';
                            } else {
                                cur += c;
                            }
                        }
                        res.push(cur.trim());
                        return res.map(val => {
                            if (val === 'NULL') return null;
                            if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                            return val;
                        });
                    };

                    const rowValues = parseCSV(tupleContent);

                    if (rowValues.length !== columns.length) {
                        currentTuple = '';
                        continue;
                    }

                    const rowData: any = {};
                    columns.forEach((col, idx) => {
                        // Map snake_case to camelCase
                        const key = col.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                        rowData[key] = rowValues[idx];
                    });

                    if (isDeposits) {
                        rowData.amount = rowData.amount ? rowData.amount.toString() : '0';
                        rowData.totalBayar = rowData.totalBayar ? rowData.totalBayar.toString() : '0';
                        rowData.totalDiterima = rowData.totalDiterima ? rowData.totalDiterima.toString() : '0';
                        if (rowData.refId === null) rowData.refId = undefined;

                        depositsBatch.push(rowData);
                        if (depositsBatch.length >= BATCH_SIZE) {
                            console.log(`Inserting batch of ${depositsBatch.length} deposits...`);
                            await db.insert(deposits).values(depositsBatch).onConflictDoNothing();
                            depositsBatch = [];
                        }
                    } else {
                        rowData.price = rowData.price ? rowData.price.toString() : '0';
                        rowData.totalAmount = rowData.totalAmount ? rowData.totalAmount.toString() : '0';

                        transactionsBatch.push(rowData);
                        if (transactionsBatch.length >= BATCH_SIZE) {
                            console.log(`Inserting batch of ${transactionsBatch.length} transactions...`);
                            // We might have issues with constraints if products/users don't exist.
                            try {
                                await db.insert(transactions).values(transactionsBatch).onConflictDoNothing();
                            } catch (e: any) {
                                console.error('Error inserting transactions batch (likely foreign key):', e.message);
                            }
                            transactionsBatch = [];
                        }
                    }

                    currentTuple = '';
                } else if (inParen === 0 && char === ',' && !inQuote) {
                    currentTuple = '';
                }
            }
        }
    }

    if (depositsBatch.length > 0) {
        console.log(`Inserting remaining ${depositsBatch.length} deposits...`);
        await db.insert(deposits).values(depositsBatch).onConflictDoNothing();
    }
    if (transactionsBatch.length > 0) {
        console.log(`Inserting remaining ${transactionsBatch.length} transactions...`);
        try {
            await db.insert(transactions).values(transactionsBatch).onConflictDoNothing();
        } catch (e: any) {
            console.error('Error inserting remaining transactions (likely foreign key):', e.message);
        }
    }

    console.log('Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});
