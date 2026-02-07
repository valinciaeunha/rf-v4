
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function testTools() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            tools: [{
                functionDeclarations: [{
                    name: "get_weather",
                    description: "Get weather",
                    parameters: { type: SchemaType.OBJECT, properties: { location: { type: SchemaType.STRING } } }
                }]
            }]
        });
        const result = await model.generateContent("How is the weather in Jakarta?");
        const response = await result.response;
        console.log("Function Calls:", response.functionCalls());
    } catch (e) {
        console.error("Tool Test Error:", e.message);
    }
}

testTools();
