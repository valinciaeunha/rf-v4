const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testV2() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello!");
        console.log("Gemini 2.0 Response:", result.response.text());
    } catch (e) {
        console.error("Gemini 2.0 Error:", e.message);
    }
}

testV2();
