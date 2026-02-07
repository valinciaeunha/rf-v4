import { NextRequest, NextResponse } from "next/server";
import { redis, db } from "@/lib/db";
import { getSessionUser } from "@/lib/actions/auth";
import { tickets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) return new NextResponse("Invalid ID", { status: 400 });

    // 1. Auth Check
    const session = await getSessionUser();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Permission Check (Must query DB to know ticket owner)
    const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, ticketId),
        columns: { userId: true }
    })

    if (!ticket) {
        return new NextResponse("Ticket not found", { status: 404 });
    }

    const isAdmin = session.role === "admin" || session.role === "owner" || session.role === "developer";

    if (ticket.userId !== session.id && !isAdmin) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            // Create separate redis client for subscription
            const subscriber = redis.duplicate();
            let isClosed = false;

            await subscriber.subscribe(`ticket:${ticketId}`);

            const messageHandler = (channel: string, message: string) => {
                if (isClosed || req.signal.aborted) return;

                if (channel === `ticket:${ticketId}`) {
                    try {
                        controller.enqueue(`data: ${message}\n\n`);
                    } catch (e) {
                        isClosed = true;
                        subscriber.quit();
                    }
                }
            };

            subscriber.on("message", messageHandler);

            // Cleanup when connection is closed
            const cleanup = () => {
                isClosed = true;
                subscriber.off("message", messageHandler);
                subscriber.quit();
                try { controller.close(); } catch (e) { }
            };

            req.signal.addEventListener("abort", cleanup);
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
