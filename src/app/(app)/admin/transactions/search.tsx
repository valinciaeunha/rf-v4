"use client"

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
import { Search } from "lucide-react"

interface TransactionSearchProps {
    placeholder?: string
}

export function TransactionSearch({ placeholder = "Search transactions..." }: TransactionSearchProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [value, setValue] = useState(searchParams.get("q") || "")

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)
            // Reset page when searching
            params.set("page", "1")
            return params.toString()
        },
        [searchParams]
    )

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (value !== (searchParams.get("q") || "")) {
                router.push(`?${createQueryString("q", value)}`)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [value, router, createQueryString, searchParams])

    return (
        <InputGroup className="w-full max-w-sm">
            <InputGroupAddon>
                <Search className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </InputGroup>
    )
}
