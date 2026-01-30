import { db } from "../src/lib/db";
import { products, productSpecifications } from "../src/lib/db/schema";

async function main() {
    try {
        console.log("Checking products table...");
        const prods = await db.select().from(products);
        console.log(`Found ${prods.length} products.`);

        console.log("Checking product_specifications table...");
        const specs = await db.select().from(productSpecifications);
        console.log(`Found ${specs.length} specifications.`);

        console.log("Sample Product:", prods[0]);
        console.log("Sample Spec:", specs[0]);
    } catch (error) {
        console.error("Error querying products table:", error);
    } finally {
        process.exit(0);
    }
}

main();
