"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Smartphone,
    CreditCard,
    HelpCircle,
    Users,
    Search,
    Component,
    Folder,
    BarChart,
    List,
    History,
    ChevronsUpDown,
    Plus,
    Zap,
    Wallet,
    Headphones,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
// import { getCurrentUser } from "@/lib/api/auth"

const data = {
    teams: [
        {
            name: "Personal Account",
            logo: Smartphone,
            plan: "Free Trial",
        },
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Toko",
            url: "/products",
            icon: Smartphone,
        },
        {
            title: "Dompet",
            url: "/billing",
            icon: Wallet,
        },
        {
            title: "Riwayat",
            url: "/history",
            icon: History,
        },
        {
            title: "Profil",
            url: "/profile",
            icon: Users,
        },
        {
            title: "Bantuan",
            url: "/support",
            icon: Headphones,
        },
    ],
}

// Define user type locally or import it
interface UserProp {
    name: string
    email: string
    avatar: string
    role?: string
    balance?: string
    whatsapp?: string | null
    discordId?: string | null
}

export function AppSidebar({ user: initialUser, ...props }: React.ComponentProps<typeof Sidebar> & { user?: UserProp }) {
    const { isMobile } = useSidebar()

    // Use passed user or fallback
    const user = initialUser || {
        name: "Guest",
        email: "",
        avatar: "",
    }

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                                <img src="/logo.png" alt="Redfinger" className="size-full object-cover" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold">Redfinger</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
