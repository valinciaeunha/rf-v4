"use client";

import { useEffect, useRef } from "react";
import { processCiaAction } from "@/lib/actions/cia-engine";

interface Message {
    id: number;
    message: string;
    createdAt: Date;
    isAdminReply: boolean;
    isAiReply: boolean;
    user: {
        username: string;
        role: string;
    };
}

interface CiaBrainProps {
    ticketId: number;
    messages: Message[];
    aiEnabled: boolean;
    onProcessingChange?: (processing: boolean) => void;
}

export function CiaBrain({
    ticketId,
    messages,
    aiEnabled,
    onProcessingChange
}: CiaBrainProps) {
    const lastProcessedId = useRef<number>(0);
    const isProcessing = useRef(false);

    useEffect(() => {
        if (!aiEnabled || isProcessing.current) return;

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) return;

        // Condition: Message from user, not yet processed, and not a reply from admin/ai
        if (!lastMsg.isAiReply && !lastMsg.isAdminReply && lastMsg.id > lastProcessedId.current) {
            if (lastMsg.user.role === 'user') {
                lastProcessedId.current = lastMsg.id;
                triggerAiProcessing();
            }
        }
    }, [messages, aiEnabled]);

    async function triggerAiProcessing() {
        if (isProcessing.current) return;

        isProcessing.current = true;
        onProcessingChange?.(true);

        try {
            console.log(`[Cia] 🚀 Triggering Server-Side Intelligence for ticket #${ticketId}`);

            const result = await processCiaAction({
                ticketId,
                messages
            });

            if (!result.success) {
                console.error("[Cia] Server Error:", result.error);
            }
        } catch (error) {
            console.error("[Cia] Fatal Error during trigger:", error);
        } finally {
            isProcessing.current = false;
            onProcessingChange?.(false);
        }
    }

    return null;
}
