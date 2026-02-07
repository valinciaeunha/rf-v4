
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db";
import { getSessionUser } from "@/lib/actions/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Auth Check
    const session = await getSessionUser();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = ['admin', 'owner', 'developer', 'support'].includes(session.role);

    const stream = new ReadableStream({
        async start(controller) {
            // Create separate redis client for subscription
            const subscriber = redis.duplicate();
            let isClosed = false;

            // Subscribe to User Channel
            await subscriber.subscribe(`user:${session.id}:tickets`);

            // If Admin, subscribe to Admin Channel too
            if (isAdmin) {
                await subscriber.subscribe(`admin:tickets`);
            }

            const messageHandler = (channel: string, message: string) => {
                if (isClosed || req.signal.aborted) return;

                try {
                    // Just pass the raw message, frontend will decide what to do
                    controller.enqueue(`data: ${message}\n\n`);
                } catch (e) {
                    isClosed = true;
                    subscriber.quit();
                }
            };

            subscriber.on("message", messageHandler);

            // Keep alive ping
            const pingInterval = setInterval(() => {
                if (isClosed || req.signal.aborted) {
                    clearInterval(pingInterval);
                    return;
                }
                try {
                    controller.enqueue(': ping\n\n');
                } catch (e) {
                    isClosed = true;
                    clearInterval(pingInterval);
                    subscriber.quit();
                }
            }, 30000);

            // Cleanup on close
            req.signal.addEventListener("abort", () => {
                isClosed = true;
                clearInterval(pingInterval);
                subscriber.quit();
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
