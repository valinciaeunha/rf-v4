"use server";

import { callAIWithFallback, sendToolResultsToAI } from "@/lib/ai/providers";
import { CIA_SYSTEM_PROMPT, CIA_TOOLS } from "@/lib/cia/prompt";
import * as CiaTools from "@/lib/actions/cia-tools";
import { saveAiReply, broadcastTyping } from "@/lib/actions/ticket";
import { getSessionUser } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { tickets, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function processCiaAction(params: {
    ticketId: number;
    messages: any[];
}) {
    // 🛡️ SECURITY: Validate Session & Ownership
    const session = await getSessionUser();
    if (!session) return { success: false, error: "Unauthorized" };

    const { ticketId, messages } = params;

    // Fetch Ticket & Owner (Source of Truth)
    const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, ticketId),
        with: {
            user: true
        }
    });

    if (!ticket) return { success: false, error: "Ticket not found" };

    // Authorization: Must be owner OR admin
    const isOwner = ticket.userId === session.id;
    const isAdmin = ['admin', 'owner', 'developer', 'support'].includes(session.role);

    if (!isOwner && !isAdmin) {
        console.error(`[Cia] 🚨 IDOR Attempt: User ${session.id} tried to access Ticket ${ticketId}`);
        return { success: false, error: "Forbidden" };
    }

    // Determine Context Variables
    const ticketOwnerId = ticket.userId;
    const currentUserName = session.username;
    const currentUserId = session.id;
    const status = ticket.status;

    try {
        // 1. Build system prompt with context
        const systemPrompt = `${CIA_SYSTEM_PROMPT}

CURRENT CONTEXT:
- Ticket ID: ${ticketId}
- Ticket Owner UserID: ${ticketOwnerId}
- Your current conversation partner is: ${currentUserName} (UserID: ${currentUserId})
- Current Ticket Status: ${status || 'open'}
- Current Time (WIB): ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        // 2. Convert messages to standard format
        const aiMessages = messages
            .filter((m: any) => m.message?.trim())
            .map((m: any) => ({
                role: (m.isAiReply || m.isAdminReply) ? "assistant" as const : "user" as const,
                content: m.message
            }));

        // 3. Call AI with auto-fallback
        await broadcastTyping(ticketId, true);

        let response = await callAIWithFallback(systemPrompt, aiMessages, CIA_TOOLS);
        let callCount = 0;
        const maxCalls = 5;

        // 4. Tool execution loop
        while (response.toolCalls && response.toolCalls.length > 0 && callCount < maxCalls) {
            callCount++;
            console.log(`[Cia] 🔧 Executing ${response.toolCalls.length} tool(s)...`);
            await broadcastTyping(ticketId, true);

            const toolResults: { name: string; result: any }[] = [];

            for (const call of response.toolCalls) {
                const { name: fnName, arguments: args } = call;
                console.log(`[Cia] ⚙️ Tool: ${fnName}`, args);

                let toolResult;
                try {
                    // SECURITY: Always force ticketOwnerId
                    switch (fnName) {
                        case "getUserProfile":
                            toolResult = await CiaTools.getUserProfile(ticketOwnerId);
                            break;
                        case "getUserTransactions":
                            toolResult = await CiaTools.getUserTransactions(ticketOwnerId, args?.limit);
                            break;
                        case "getTransactionDetail":
                            toolResult = await CiaTools.getTransactionDetail(args?.trxIdOrOrderId, ticketOwnerId);
                            break;
                        case "getPendingTransactions":
                            toolResult = await CiaTools.getPendingTransactions(ticketOwnerId);
                            break;
                        case "getUserDeposits":
                            toolResult = await CiaTools.getUserDeposits(ticketOwnerId);
                            break;
                        case "checkProductStock":
                            toolResult = await CiaTools.checkProductStock(args?.query);
                            break;
                        case "getAllProducts":
                            toolResult = await CiaTools.getAllProducts();
                            break;
                        case "closeTicket":
                            toolResult = await CiaTools.closeTicket(ticketId);
                            break;
                        case "disableAi":
                            toolResult = await CiaTools.disableAi(ticketId);
                            break;
                        default:
                            toolResult = { error: "Unknown tool" };
                    }
                } catch (te: any) {
                    console.error(`[Cia] Tool ${fnName} failed:`, te.message);
                    toolResult = { error: "Execution failed", details: te.message };
                }

                toolResults.push({ name: fnName, result: toolResult });
            }

            // Send tool results back to AI
            response = await sendToolResultsToAI(
                response.provider,
                response.model,
                systemPrompt,
                [
                    ...aiMessages,
                    { role: "assistant" as const, content: response.content || "Checking system..." }
                ],
                toolResults,
                CIA_TOOLS
            );
        }

        // 5. Save final response
        const finalReply = response.content;
        if (finalReply && finalReply.trim()) {
            await saveAiReply({ ticketId, message: finalReply });
            console.log(`[Cia] ✅ Reply saved (via ${response.provider}/${response.model})`);
        }

        return { success: true, provider: response.provider, model: response.model };

    } catch (error: any) {
        console.error("[Cia] Fatal Error:", error.message);
        return { success: false, error: error.message };
    }
}
