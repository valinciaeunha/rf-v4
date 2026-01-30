import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AuthGuard } from "@/components/auth-guard"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import { getSessionUser } from "@/lib/actions/auth"

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSessionUser()

    const user = session ? {
        name: session.username,
        email: session.email,
        avatar: "",
        role: session.role,
        balance: session.balance,
        whatsapp: session.whatsappNumber,
        discordId: session.discordId,
    } : undefined

    return (
        <AuthGuard>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" user={user} />
                <SidebarInset>
                    <SiteHeader />
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    )
}
