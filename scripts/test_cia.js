const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function testFlashLatest() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const m = "gemini-flash-latest";
    try {
        console.log(`Testing model: ${m}...`);
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Hello!");
        console.log(`[SUCCESS] Response: ${result.response.text()}`);
    } catch (e) {
        console.log(`[FAILED] Error: ${e.message}`);
    }
}

testFlashLatest();
