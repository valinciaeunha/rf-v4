"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
// import { api } from "@/lib/api";

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // useEffect(() => {
    //     const trackVisit = async () => {
    //         const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    //         try {
    //             // Determine if we have a token to send (optional, api client usually handles authorization header automatically if token is set)
    //             // The backend endpoint accepts anonymous too.
    //             // await api.post("/analytics/visit", { path: url });
    //         } catch (error) {
    //             // Silent fail
    //             console.error("Tracking Error:", error);
    //         }
    //     };

    //     trackVisit();
    // }, [pathname, searchParams]); // Run on route change

    return null; // Component renders nothing
}
