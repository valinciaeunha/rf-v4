import { config } from 'dotenv';
config({ path: '.env.local' });

async function testQwenAPI() {
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
        console.error("DASHSCOPE_API_KEY not set!");
        return;
    }

    console.log("Testing Qwen API (Alibaba Cloud Model Studio)...");
    console.log("API Key (first 10 chars):", apiKey.substring(0, 10) + "...");

    const endpoint = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
    const models = ["qwen-plus", "qwen-flash", "qwen-turbo", "qwen3-max", "qwen-max"];

    for (const model of models) {
        console.log(`\n--- Testing model: ${model} ---`);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: "Say 'Hello from Qwen!' in Indonesian." }
                    ]
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("✅ SUCCESS!");
                console.log("Response:", data.choices?.[0]?.message?.content);
                console.log("Usage:", data.usage);
                return; // Exit on success
            } else {
                console.log("❌ Error:", data.error?.message || data.error?.code || JSON.stringify(data));
            }
        } catch (e: any) {
            console.log("❌ Network Error:", e.message);
        }
    }

    console.log("\n⚠️ All models failed. Please check if your API key is activated in Alibaba Console.");
}

testQwenAPI();
