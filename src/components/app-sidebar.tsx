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
    Shield,
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

// Define admin nav items
const adminNav = [
    {
        title: "Administrator",
        url: "#",
        icon: Shield,
        items: [
            {
                title: "Users",
                url: "/admin/users",
            },
            {
                title: "Produk",
                url: "/admin/products",
            },
            {
                title: "Transaksi",
                url: "/admin/transactions",
            },
        ],
    },
]

// Define developer-only nav items
const developerNav = [
    {
        title: "Developer",
        url: "#",
        icon: Zap,
        items: [
            {
                title: "Audit Logs",
                url: "/developer/audit-logs",
            },
            {
                title: "Backup",
                url: "/developer/backup",
            },
            {
                title: "Discord Bot",
                url: "/developer/discord-bot",
            },
        ],
    },
]

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
        role: "user",
    }

    // Filter/Combine nav items based on role
    const navItems = [...data.navMain]
    if (user.role === "admin" || user.role === "developer") {
        // @ts-ignore - Combine types loosely
        navItems.push(...adminNav)
    }
    if (user.role === "developer") {
        // @ts-ignore - Developer-only menu
        navItems.push(...developerNav)
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
                {/* @ts-ignore - NavMain accepts updated Item type */}
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
