"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavItem {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
        title: string
        url: string
    }[]
}

export function NavMain({
    items,
}: {
    items: NavItem[]
}) {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <NavMainItem key={item.title} item={item} />
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

function NavMainItem({ item }: { item: NavItem }) {
    const pathname = usePathname()
    const hasChildren = item.items && item.items.length > 0

    // Check if any child is active based on current path
    const isChildActive = hasChildren && item.items?.some(
        (child) => pathname.startsWith(child.url)
    )

    // Keep dropdown open if a child is active or if manually opened
    const [isOpen, setIsOpen] = useState(item.isActive || isChildActive || false)

    // Update open state when pathname changes (e.g., navigating to a child)
    useEffect(() => {
        if (isChildActive) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsOpen(true)
        }
    }, [isChildActive])

    if (hasChildren) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => setIsOpen(!isOpen)}
                    className="cursor-pointer"
                >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    />
                </SidebarMenuButton>
                {isOpen && (
                    <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === subItem.url}
                                >
                                    <a href={subItem.url}>
                                        <span>{subItem.title}</span>
                                    </a>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                )}
            </SidebarMenuItem>
        )
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={pathname === item.url}
            >
                <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                </a>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

