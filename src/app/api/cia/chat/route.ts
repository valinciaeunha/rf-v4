import { NextRequest, NextResponse } from "next/server";
import { callAIWithFallback, sendToolResultsToAI } from "@/lib/ai/providers";
import { CIA_SYSTEM_PROMPT, CIA_TOOLS } from "@/lib/cia/prompt";
import * as ciaTools from "@/lib/actions/cia-tools";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface ChatRequest {
    message: string;
    ticketId?: number;
    userId: number; // Required for security
    platform?: "web" | "discord" | "mobile" | "api";
    conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(userId: number, username: string, ticketId: number): string {
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    return `${CIA_SYSTEM_PROMPT}

📌 CURRENT CONTEXT:
- Ticket ID: ${ticketId || "N/A (Direct API)"}
- User ID: ${userId}
- Username: ${username}
- Current Time (WIB): ${now}
`;
}

/**
 * CIA Chat API - Multi-platform AI Assistant
 * 
 * POST /api/cia/chat
 * 
 * Body:
 * - message: string (user's message)
 * - userId: number (required for security)
 * - ticketId?: number (optional, for ticket context)
 * - platform?: "web" | "discord" | "mobile" | "api"
 * - conversationHistory?: array of previous messages
 * 
 * Returns:
 * - response: string (AI's text response)
 * - toolsUsed?: array of tool names that were called
 * - ticketClosed?: boolean (if closeTicket was called)
 * - aiDisabled?: boolean (if disableAi was called)
 */
export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();

        // Validate required fields
        if (!body.message || typeof body.message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        if (!body.userId || typeof body.userId !== "number") {
            return NextResponse.json(
                { error: "userId is required for security" },
                { status: 400 }
            );
        }

        // Verify user exists
        const user = await db.query.users.findFirst({
            where: eq(users.id, body.userId),
            columns: { id: true, username: true, email: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const platform = body.platform || "api";
        const ticketId = body.ticketId || 0;

        // Build system prompt with user context
        const systemPrompt = buildSystemPrompt(
            body.userId,
            user.username || "User",
            ticketId
        );

        // Build messages array for history
        const historyMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

        // Add conversation history if provided
        if (body.conversationHistory && Array.isArray(body.conversationHistory)) {
            for (const msg of body.conversationHistory) {
                if (msg.role === "user" || msg.role === "assistant") {
                    historyMessages.push({
                        role: msg.role as "user" | "assistant",
                        content: msg.content
                    });
                }
            }
        }

        // Add current user message
        historyMessages.push({ role: "user", content: body.message });

        // Call AI with fallback providers
        let aiResult = await callAIWithFallback(systemPrompt, historyMessages, CIA_TOOLS);

        if (!aiResult) {
            return NextResponse.json(
                { error: "All AI providers failed" },
                { status: 503 }
            );
        }

        const toolsUsed: string[] = [];
        let ticketClosed = false;
        let aiDisabled = false;
        let finalResponse = aiResult.content || "";

        // Process tool calls if any
        if (aiResult.toolCalls && aiResult.toolCalls.length > 0) {
            const toolResults: Array<{ name: string; result: any }> = [];

            for (const tool of aiResult.toolCalls) {
                toolsUsed.push(tool.name);
                const args = tool.arguments || {};
                let result: any = null;

                try {
                    switch (tool.name) {
                        case "getUserProfile":
                            // Security: Only allow fetching own profile
                            result = await ciaTools.getUserProfile(body.userId);
                            break;

                        case "getUserTransactions":
                            result = await ciaTools.getUserTransactions(
                                body.userId,
                                args.limit || 5
                            );
                            break;

                        case "getTransactionDetail":
                            // Security: userId is enforced in the function
                            result = await ciaTools.getTransactionDetail(
                                args.trxIdOrOrderId || args.orderId,
                                body.userId
                            );
                            break;

                        case "getUserDeposits":
                            result = await ciaTools.getUserDeposits(
                                body.userId,
                                args.limit || 5
                            );
                            break;

                        case "checkProductStock":
                            result = await ciaTools.checkProductStock(args.query);
                            break;

                        case "getAllProducts":
                            result = await ciaTools.getAllProducts();
                            break;

                        case "closeTicket":
                            if (ticketId > 0) {
                                result = await ciaTools.closeTicket(ticketId);
                                ticketClosed = true;
                            } else {
                                result = "No ticket context provided";
                            }
                            break;

                        case "disableAi":
                            if (ticketId > 0) {
                                result = await ciaTools.disableAi(ticketId);
                                aiDisabled = true;
                            } else {
                                result = "No ticket context provided";
                            }
                            break;

                        default:
                            result = `Unknown tool: ${tool.name}`;
                    }
                } catch (toolError: any) {
                    console.error(`Tool error [${tool.name}]:`, toolError);
                    result = `Error executing ${tool.name}: ${toolError.message}`;
                }

                toolResults.push({ name: tool.name, result });
            }

            // Send tool results back to AI for final response
            const followUp = await sendToolResultsToAI(
                aiResult.provider,
                aiResult.model,
                systemPrompt,
                historyMessages,
                toolResults,
                CIA_TOOLS
            );

            if (followUp?.content) {
                finalResponse = followUp.content;
            }
        }

        // Log for debugging (optional)
        console.log(`[CIA/${platform}] User ${body.userId}: "${body.message.substring(0, 50)}..." -> Tools: [${toolsUsed.join(", ")}]`);

        return NextResponse.json({
            response: finalResponse,
            toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
            ticketClosed: ticketClosed || undefined,
            aiDisabled: aiDisabled || undefined,
            provider: aiResult.provider,
            model: aiResult.model
        });

    } catch (error: any) {
        console.error("[CIA API Error]", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "CIA Chat API",
        version: "1.0.0",
        availableTools: CIA_TOOLS.map(t => t.name)
    });
}
