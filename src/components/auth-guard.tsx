"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/actions/auth";

// Cache key for session verification
const VERIFIED_TOKEN_KEY = "auth_verified_token";

function getVerifiedToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(VERIFIED_TOKEN_KEY);
}

function setVerifiedToken(token: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(VERIFIED_TOKEN_KEY, token);
}

function clearVerifiedToken(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(VERIFIED_TOKEN_KEY);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const session = await getSessionUser();

                if (!session) {
                    // Not logged in
                    router.replace("/login");
                }
                // Logged in - do nothing, let children render
            } catch (e) {
                router.replace("/login");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);


    // Non-blocking Auth Guard (Optimistic UI)
    // We render children immediately while checking auth in background.
    // If not logged in, we redirect. This prevents "blank white/black screen" on load.

    // We can still use isLoading state if we wanted to show a subtle progress bar, 
    // but for now we just render children.

    return <>{children}</>;
}
