import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Test ALL free Qwen models from different providers
 */

interface Provider {
    name: string;
    endpoint: string;
    apiKey: string | undefined;
    keyHeader: string;
    models: string[];
    extraHeaders?: Record<string, string>;
}

async function testAllFreeQwen() {
    console.log("🔍 Testing ALL Free Qwen Models from Various Providers\n");

    const providers: Provider[] = [
        // 1. Alibaba Dashscope (International)
        {
            name: "Alibaba Dashscope (Intl)",
            endpoint: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
            apiKey: process.env.DASHSCOPE_API_KEY,
            keyHeader: "Authorization",
            models: ["qwen-plus", "qwen-turbo", "qwen-max", "qwen3-235b-a22b", "qwen3-32b", "qwen3-8b"]
        },
        // 2. OpenRouter (has FREE Qwen models)
        {
            name: "OpenRouter (Free Tier)",
            endpoint: "https://openrouter.ai/api/v1/chat/completions",
            apiKey: process.env.OPENROUTER_API_KEY,
            keyHeader: "Authorization",
            models: [
                "qwen/qwen3-4b:free",
                "qwen/qwen-2.5-coder-32b-instruct:free",
                "qwen/qwen3-30b-a3b:free"
            ],
            extraHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "RedFinger Test"
            }
        },
        // 3. SiliconFlow (has free Qwen models)
        {
            name: "SiliconFlow",
            endpoint: "https://api.siliconflow.cn/v1/chat/completions",
            apiKey: process.env.SILICONFLOW_API_KEY,
            keyHeader: "Authorization",
            models: ["Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2-7B-Instruct"]
        }
    ];

    let successCount = 0;

    for (const provider of providers) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`📡 Provider: ${provider.name}`);
        console.log(`${"=".repeat(60)}`);

        if (!provider.apiKey) {
            console.log(`⚠️ No API key configured. Skipping...`);
            continue;
        }

        console.log(`🔑 API Key: ${provider.apiKey.substring(0, 10)}...`);

        for (const model of provider.models) {
            console.log(`\n  🤖 Model: ${model}`);

            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                    [provider.keyHeader]: `Bearer ${provider.apiKey}`,
                    ...provider.extraHeaders
                };

                const response = await fetch(provider.endpoint, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: "user", content: "Reply with exactly: 'Qwen works! 🎉'" }
                        ],
                        max_tokens: 50
                    })
                });

                const data = await response.json();

                if (response.ok && data.choices?.[0]?.message?.content) {
                    console.log(`  ✅ SUCCESS! Response: ${data.choices[0].message.content.substring(0, 50)}`);
                    successCount++;
                } else {
                    const errMsg = data.error?.message || data.error?.code || JSON.stringify(data).substring(0, 100);
                    console.log(`  ❌ Error: ${errMsg}`);
                }
            } catch (e: any) {
                console.log(`  ❌ Network Error: ${e.message}`);
            }
        }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 SUMMARY: ${successCount} model(s) working!`);
    console.log(`${"=".repeat(60)}`);

    if (successCount === 0) {
        console.log(`
💡 TIPS:
1. Get free OpenRouter key: https://openrouter.ai/keys
2. Get Gemini key (best for tools): https://aistudio.google.com/app/apikey
3. Check if Alibaba Dashscope key is activated in console
        `);
    }
}

testAllFreeQwen();
