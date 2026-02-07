const { GoogleGenerativeAI } = require("@google/generative-ai");

async function debugKey() {
    const key = "AIzaSyARkwsdoXhSq03jeLiQ2MrVYKOk5xPn9vs";
    console.log(`Key length: ${key.length}`);
    const genAI = new GoogleGenerativeAI(key);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.log("Error type:", typeof e);
        console.log("Error message:", e.message);
        console.log("Error full:", e);
    }
}

debugKey();
