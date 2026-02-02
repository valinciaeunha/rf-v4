"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/actions/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const session = await getSessionUser();

                if (!session) {
                    // Not logged in - redirect handled by middleware
                    // but double-check here for client-side navigation
                    router.replace("/login");
                }
                // Logged in - do nothing, children already rendered
            } catch {
                router.replace("/login");
            }
        };

        checkAuth();
    }, [router]);

    // Optimistic UI: render children immediately while checking auth in background
    // If not logged in, middleware will redirect. This prevents loading screen.
    return <>{children}</>;
}
