"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { replyTicket } from "@/lib/actions/ticket"
import { toast } from "sonner"
import { Send, User, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    id: number
    message: string
    createdAt: Date
    isAdminReply: boolean
    user: {
        username: string | null
        avatar: string | null
        role: string | null
    }
}

interface Ticket {
    id: number
    subject: string
    status: "open" | "answered" | "closed"
    priority: string
}

interface TicketChatProps {
    ticket: Ticket
    messages: Message[]
    currentUserId: number
    viewMode?: "user" | "admin"
}

export function TicketChat({ ticket, messages, currentUserId, viewMode = "user" }: TicketChatProps) {
    const [reply, setReply] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async () => {
        if (!reply.trim()) return

        setLoading(true)
        const result = await replyTicket({
            ticketId: ticket.id,
            message: reply
        })
        setLoading(false)

        if (result.success) {
            setReply("")
            toast.success("Balasan terkirim")
        } else {
            toast.error("Gagal mengirim balasan")
        }
    }

    const isClosed = ticket.status === "closed"

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
            {/* Header Status */}
            <div className="flex items-center justify-between mb-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                    <h2 className="text-xl font-bold">{ticket.subject}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tiket #{ticket.id} • {new Date().toLocaleDateString('id-ID')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>
                        {ticket.priority.toUpperCase()}
                    </Badge>
                    <Badge variant={
                        ticket.status === 'open' ? 'default' :
                            ticket.status === 'answered' ? 'secondary' : 'outline'
                    }>
                        {ticket.status.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col mb-4 overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                        // Logic display:
                        // VIEW USER: 
                        // - msg.isAdminReply (Admin) -> Kiri (Support)
                        // - !msg.isAdminReply (User) -> Kanan (Me)

                        // VIEW ADMIN:
                        // - msg.isAdminReply (Admin) -> Kanan (Me)
                        // - !msg.isAdminReply (User) -> Kiri (Customer)

                        let isMe = false
                        if (viewMode === "user") {
                            isMe = !msg.isAdminReply
                        } else {
                            isMe = msg.isAdminReply
                        }

                        const alignment = isMe ? "justify-end" : "justify-start"
                        const senderName = viewMode === "user"
                            ? (isMe ? "Anda" : "Support Team")
                            : (isMe ? "Anda (Admin)" : msg.user.username || "User")

                        return (
                            <div key={msg.id} className={cn("flex w-full gap-2", alignment)}>
                                {!isMe && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={viewMode === "user" ? "/bot-avatar.png" : (msg.user.avatar || "")} />
                                        <AvatarFallback>{viewMode === "user" ? <ShieldAlert className="h-4 w-4" /> : <User className="h-4 w-4" />}</AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={cn(
                                    "max-w-[80%] rounded-lg p-3 text-sm",
                                    isMe
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted text-muted-foreground rounded-tl-none"
                                )}>
                                    <div className="font-semibold text-xs mb-1 opacity-70">
                                        {senderName}
                                    </div>
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <div className="text-[10px] opacity-70 mt-2 text-right">
                                        {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {isMe && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={viewMode === "user" ? (msg.user.avatar || "") : "/bot-avatar.png"} />
                                        <AvatarFallback>{viewMode === "user" ? <User className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )
                    })}
                    <div ref={scrollRef} />
                </CardContent>

                <Separator />

                <CardFooter className="p-4 bg-muted/10">
                    {isClosed ? (
                        <div className="w-full text-center p-4 text-muted-foreground bg-muted rounded-lg">
                            Tiket ini telah ditutup. Silakan buat tiket baru jika ada masalah lain.
                        </div>
                    ) : (
                        <div className="flex w-full gap-2">
                            <Textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Tulis balasan..."
                                className="min-h-[60px] resize-none"
                                disabled={loading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                            />
                            <Button
                                size="icon"
                                className="h-auto w-14"
                                onClick={handleSend}
                                disabled={loading || !reply.trim()}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
