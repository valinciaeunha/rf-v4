
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function checkModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // There is no listModels in the SDK but we can try to hit the discovery endpoint
        // Actually the SDK doesn't expose listModels easily.
        // Let's use fetch directly with the key.

        const key = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models (v1):");
            data.models.forEach(m => {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("Unexpected response format:", data);
        }

        const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const dataBeta = await responseBeta.json();
        if (dataBeta.models) {
            console.log("\nAvailable Models (v1beta):");
            dataBeta.models.forEach(m => {
                console.log(`- ${m.name}`);
            });
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkModels();
