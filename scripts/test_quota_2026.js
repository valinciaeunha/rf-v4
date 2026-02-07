
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function testQuota() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-pro", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash-lite"];

    for (const m of models) {
        try {
            console.log(`Testing model: ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hi");
            console.log(`[OK] ${m}: ${result.response.text().substring(0, 20)}`);
            break; // Found one!
        } catch (e) {
            console.log(`[FAIL] ${m}: ${e.message}`);
        }
    }
}

testQuota();
