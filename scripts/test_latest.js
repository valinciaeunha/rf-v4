const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testLatest() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello!");
        console.log("Gemini Latest Response:", result.response.text());
    } catch (e) {
        console.error("Gemini Latest Error:", e.message);
    }
}

testLatest();
