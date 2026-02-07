"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateTicketStatus, toggleAiForTicket } from "@/lib/actions/ticket"
import { toast } from "sonner"
import { CheckCircle, XCircle, RotateCcw, Bot } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AdminTicketControlsProps {
    ticketId: number
    status: string
    aiEnabled: boolean
}

export function AdminTicketControls({ ticketId, status, aiEnabled }: AdminTicketControlsProps) {
    const [loading, setLoading] = useState(false)
    const [isAiOn, setIsAiOn] = useState(aiEnabled)

    const handleStatusChange = async (newStatus: "open" | "closed") => {
        setLoading(true)
        const result = await updateTicketStatus(ticketId, newStatus)
        setLoading(false)

        if (result.success) {
            toast.success(`Ticket marked as ${newStatus}`)
        } else {
            toast.error("Failed to update status")
        }
    }

    const handleToggleAi = async (checked: boolean) => {
        setIsAiOn(checked)
        const result = await toggleAiForTicket(ticketId, checked)
        if (result.success) {
            toast.success(`AI ${checked ? "Enabled" : "Disabled"} for this ticket`)
        } else {
            setIsAiOn(!checked)
            toast.error("Failed to toggle AI")
        }
    }

    return (
        <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                <Bot className={`h-4 w-4 ${isAiOn ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                <Label htmlFor="ai-mode" className="text-xs font-medium cursor-pointer">AI Mode</Label>
                <Switch
                    id="ai-mode"
                    checked={isAiOn}
                    onCheckedChange={handleToggleAi}
                    className="h-5 w-9 data-[state=checked]:bg-primary"
                />
            </div>

            {status === "closed" ? (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange("open")} disabled={loading} className="h-8">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reopen Ticket
                </Button>
            ) : (
                <Button variant="destructive" size="sm" onClick={() => handleStatusChange("closed")} disabled={loading} className="h-8">
                    <XCircle className="mr-2 h-4 w-4" />
                    Close Ticket
                </Button>
            )}
        </div>
    )
}
