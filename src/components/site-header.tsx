"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeSwitcher } from "@/components/mode-switcher"

const routeTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/profile": "Profil",
    "/products": "Toko",
    "/support": "Bantuan",
    "/billing": "Dompet",
    "/history": "Riwayat",
    "/settings": "Pengaturan",
}

export function SiteHeader() {
    const pathname = usePathname()
    // Default to "Dashboard" or check exact data, fallback to formatted path
    const title = routeTitles[pathname] || pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex w-full items-center gap-2 px-4 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <img src="/logo.png" alt="Redfinger Logo" className="h-5 w-auto mr-1" />
                <h1 className="text-sm font-bold uppercase tracking-tighter capitalize">{title}</h1>
                <div className="ml-auto flex items-center gap-2">
                    <ModeSwitcher />
                </div>
            </div>
        </header>
    )
}
