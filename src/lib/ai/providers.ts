"use server";

/**
 * Multi-Provider AI Engine for Cia
 * Supports: Gemini (Google), Qwen (Alibaba via Dashscope), OpenRouter, etc.
 * Auto-fallback when one provider fails (rate limit, error, etc.)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ==================== TYPES ====================
interface AIMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface AITool {
    name: string;
    description: string;
    parameters: any;
}

interface AIResponse {
    content: string | null;
    toolCalls?: {
        name: string;
        arguments: any;
    }[];
    provider: string;
    model: string;
}

interface ProviderConfig {
    name: string;
    models: string[];
    apiKey: string | undefined;
    enabled: boolean;
}

// ==================== PROVIDER CONFIGS ====================
// Priority order: OpenRouter (working) > Gemini (best tools) > Qwen (backup)
function getProviders(): ProviderConfig[] {
    return [
        // 1. OpenRouter - Currently working, free models available
        {
            name: "openrouter",
            models: [
                "arcee-ai/trinity-large-preview:free", // Verified working
                "google/gemma-2-9b-it:free",
                "mistralai/mistral-7b-instruct:free",
                // "nvidia/nemotron-3-nano-30b-a3b:free", // Rate limited
                // "stepfun/step-3.5-flash:free", // Rate limited
                "upstage/solar-pro-3:free",
                "liquid/lfm-2.5-1.2b-instruct:free",
                "liquid/lfm-2.5-1.2b-thinking:free",
                "openrouter/pony-alpha"
            ],
            apiKey: process.env.OPENROUTER_API_KEY,
            enabled: !!process.env.OPENROUTER_API_KEY
        },
        // 2. Gemini - Best for tool calling
        {
            name: "gemini",
            models: [
                "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-1.5-flash-8b"
            ],
            apiKey: process.env.GEMINI_API_KEY,
            enabled: !!process.env.GEMINI_API_KEY
        },
        // 3. Qwen - Backup (currently key is invalid)
        {
            name: "qwen",
            models: [
                "qwen-turbo",
                "qwen-plus"
            ],
            apiKey: process.env.DASHSCOPE_API_KEY,
            enabled: !!process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY.startsWith("sk-") && process.env.DASHSCOPE_API_KEY.length > 20
        }
    ];
}

// ==================== GEMINI PROVIDER ====================
async function callGemini(
    model: string,
    systemPrompt: string,
    messages: AIMessage[],
    tools?: AITool[]
): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    // Convert messages to Gemini format
    const history: any[] = [];
    let currentRole = "";
    let currentContent = "";

    for (const msg of messages) {
        if (msg.role === "system") continue; // System prompt handled separately
        const role = msg.role === "assistant" ? "model" : "user";

        if (role === currentRole) {
            currentContent += "\n\n" + msg.content;
        } else {
            if (currentRole) {
                history.push({ role: currentRole, parts: [{ text: currentContent }] });
            }
            currentRole = role;
            currentContent = msg.content;
        }
    }
    if (currentRole) {
        history.push({ role: currentRole, parts: [{ text: currentContent }] });
    }

    // Ensure starts with user
    if (history.length > 0 && history[0].role === 'model') {
        history.shift();
    }

    const lastUserMessage = (history.length > 0 && history[history.length - 1].role === 'user')
        ? history.pop()
        : { role: 'user', parts: [{ text: "Hello" }] };

    // Initialize model
    const geminiModel = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
        tools: tools ? [{
            functionDeclarations: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }))
        }] : undefined
    });

    const chat = geminiModel.startChat({ history });
    const result = await chat.sendMessage(lastUserMessage?.parts[0]?.text || "Hello");
    const response = result.response;

    // Parse response
    const parts = response.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text);
    const toolCalls = parts
        .filter((p: any) => p.functionCall)
        .map((p: any) => ({
            name: p.functionCall.name,
            arguments: p.functionCall.args
        }));

    return {
        content: textPart?.text || null,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        provider: "gemini",
        model
    };
}

// ==================== QWEN PROVIDER (Alibaba Cloud Model Studio) ====================
async function callQwen(
    model: string,
    systemPrompt: string,
    messages: AIMessage[],
    tools?: AITool[]
): Promise<AIResponse> {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error("DASHSCOPE_API_KEY not set");

    // Format messages for OpenAI-compatible API
    const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    // Format tools for OpenAI-compatible format
    const formattedTools = tools?.map(t => ({
        type: "function",
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }
    }));

    // Try multiple endpoints (International Model Studio → Dashscope)
    const endpoints = [
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: formattedMessages,
                    tools: formattedTools,
                    tool_choice: tools ? "auto" : undefined
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Qwen API Error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            const message = choice?.message;

            return {
                content: message?.content || null,
                toolCalls: message?.tool_calls?.map((tc: any) => ({
                    name: tc.function.name,
                    arguments: JSON.parse(tc.function.arguments || "{}")
                })),
                provider: "qwen",
                model
            };
        } catch (e: any) {
            lastError = e;
            console.warn(`[Qwen] Endpoint ${endpoint} failed: ${e.message}`);
        }
    }

    throw lastError || new Error("All Qwen endpoints failed");
}

// ==================== OPENROUTER PROVIDER ====================
async function callOpenRouter(
    model: string,
    systemPrompt: string,
    messages: AIMessage[],
    tools?: AITool[]
): Promise<AIResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const formattedTools = tools?.map(t => ({
        type: "function",
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "RedFinger Support"
        },
        body: JSON.stringify({
            model,
            messages: formattedMessages,
            tools: formattedTools,
            tool_choice: tools ? "auto" : undefined
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    return {
        content: message?.content || null,
        toolCalls: message?.tool_calls?.map((tc: any) => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || "{}")
        })),
        provider: "openrouter",
        model
    };
}

// ==================== MAIN: CALL WITH FALLBACK ====================
export async function callAIWithFallback(
    systemPrompt: string,
    messages: AIMessage[],
    tools?: AITool[]
): Promise<AIResponse> {
    const providers = getProviders().filter(p => p.enabled);

    if (providers.length === 0) {
        throw new Error("No AI providers configured. Please set at least one API key: GEMINI_API_KEY, DASHSCOPE_API_KEY, or OPENROUTER_API_KEY");
    }

    const errors: string[] = [];

    for (const provider of providers) {
        for (const model of provider.models) {
            try {
                console.log(`[AI] Trying ${provider.name}/${model}...`);

                let response: AIResponse;

                switch (provider.name) {
                    case "gemini":
                        response = await callGemini(model, systemPrompt, messages, tools);
                        break;
                    case "qwen":
                        response = await callQwen(model, systemPrompt, messages, tools);
                        break;
                    case "openrouter":
                        response = await callOpenRouter(model, systemPrompt, messages, tools);
                        break;
                    default:
                        continue;
                }

                console.log(`[AI] ✅ Success with ${provider.name}/${model}`);
                return response;

            } catch (error: any) {
                const errMsg = `${provider.name}/${model}: ${error.message}`;
                console.warn(`[AI] ❌ Failed: ${errMsg}`);
                errors.push(errMsg);
                // Continue to next model/provider
            }
        }
    }

    throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
}

// ==================== TOOL RESPONSE HANDLER ====================
export async function sendToolResultsToAI(
    provider: string,
    model: string,
    systemPrompt: string,
    messages: AIMessage[],
    toolResults: { name: string; result: any }[],
    tools?: AITool[]
): Promise<AIResponse> {
    // For Gemini, we need special handling
    if (provider === "gemini") {
        // Append tool results as function responses and call again
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

        // This would require maintaining the chat session, which is complex
        // For now, we'll convert tool results to a simple message
        const toolResultsText = toolResults
            .map(tr => `[Tool: ${tr.name}]\n${JSON.stringify(tr.result, null, 2)}`)
            .join("\n\n");

        const updatedMessages: AIMessage[] = [
            ...messages,
            { role: "assistant", content: `I'm checking the system...` },
            { role: "user", content: `Here are the results from the system:\n${toolResultsText}\n\nPlease provide your response based on this information.` }
        ];

        return callGemini(model, systemPrompt, updatedMessages, undefined);
    }

    // For OpenAI-compatible APIs (Qwen, OpenRouter), append tool results properly
    const updatedMessages: AIMessage[] = [
        ...messages,
        {
            role: "assistant",
            content: `Tool results received:\n${toolResults.map(tr => `${tr.name}: ${JSON.stringify(tr.result)}`).join("\n")}`
        }
    ];

    switch (provider) {
        case "qwen":
            return callQwen(model, systemPrompt, updatedMessages, undefined);
        case "openrouter":
            return callOpenRouter(model, systemPrompt, updatedMessages, undefined);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
