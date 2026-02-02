"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeSwitcher } from "@/components/mode-switcher"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="container flex h-14 items-center px-4 md:px-6 mx-auto">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-8 flex items-center space-x-2">
                        <img src="/logo.png" alt="Redfinger Icon" className="h-6 w-auto" />
                        <span className="hidden font-bold sm:inline-block tracking-tighter uppercase text-sm">Redfinger.id</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-[11px] font-bold uppercase tracking-widest">
                        <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                        <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Steps</Link>
                        <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                        <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                    </nav>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2 md:hidden size-8">
                            <Menu className="h-4 w-4" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="pr-0">
                        <SheetHeader className="text-left px-6">
                            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                            <SheetDescription className="sr-only">
                                Akses cepat ke fitur, harga, dan layanan Redfinger.
                            </SheetDescription>
                            <Link href="/" className="flex items-center space-x-2">
                                <img src="/logo.png" alt="Redfinger Icon" className="h-6 w-auto" />
                                <span className="font-bold tracking-tighter uppercase text-sm">Redfinger.id</span>
                            </Link>
                        </SheetHeader>
                        <nav className="flex flex-col gap-6 mt-12 px-6 text-xs font-bold uppercase tracking-widest">
                            <SheetClose asChild>
                                <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/#how-it-works" className="hover:text-foreground transition-colors">Steps</Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
                            </SheetClose>
                        </nav>
                    </SheetContent>
                </Sheet>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <nav className="flex items-center space-x-2">
                        <ModeSwitcher />
                        <Separator orientation="vertical" className="mx-1 h-4 border-border/50" />
                        <Button asChild variant="ghost" size="sm" className="hidden sm:flex font-bold tracking-widest text-[10px] uppercase h-8 rounded-md px-3">
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild size="sm" className="bg-foreground hover:bg-foreground/90 text-background font-bold tracking-widest text-[10px] uppercase h-8 rounded-md px-4 shadow-sm">
                            <Link href="/dashboard">Dashboard Area</Link>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    )
}
