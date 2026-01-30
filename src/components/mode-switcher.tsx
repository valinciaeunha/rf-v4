"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function ModeSwitcher() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = React.useCallback(() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }, [resolvedTheme, setTheme])

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.key === "d" || e.key === "D") && !e.metaKey && !e.ctrlKey) {
                if (
                    (e.target instanceof HTMLElement && e.target.isContentEditable) ||
                    e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement ||
                    e.target instanceof HTMLSelectElement
                ) {
                    return
                }

                e.preventDefault()
                toggleTheme()
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [toggleTheme])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="size-8" disabled>
                <div className="size-4" />
            </Button>
        )
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={toggleTheme}
                >
                    {resolvedTheme === "dark" ? (
                        <Sun className="size-4" />
                    ) : (
                        <Moon className="size-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2 pr-1">
                Toggle Mode <span className="text-[10px] font-bold border border-border/50 bg-muted px-1 rounded ml-1">D</span>
            </TooltipContent>
        </Tooltip>
    )
}
