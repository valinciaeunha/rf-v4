"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { replyTicket, broadcastTyping } from "@/lib/actions/ticket"
import { toast } from "sonner"
import { Send, User, ShieldAlert, CheckCheck, Clock, Bot, Paperclip, MoreVertical, ExternalLink, Receipt, CreditCard, Tag, ArrowRight } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from "@/lib/utils"
import { getCachedMessages, setCachedMessages, isTicketViewed, markTicketViewed } from "@/lib/support-cache"
import { CiaBrain } from "./CiaBrain"
import { TypewriterText } from "./TypewriterText"

interface Message {
    id: number
    message: string
    createdAt: Date
    isAdminReply: boolean
    isAiReply: boolean
    user: {
        username: string
        role: string
    }
    isOptimistic?: boolean
}

interface Ticket {
    id: number
    userId: number
    subject: string
    status: "open" | "answered" | "closed"
    priority: string
    aiEnabled?: boolean
}

interface TicketChatProps {
    ticket: Ticket
    messages: Message[]
    currentUserId: number
    currentUserName: string
    viewMode?: "user" | "admin"
}

export function TicketChat({ ticket, messages, currentUserId, currentUserName, viewMode = "user" }: TicketChatProps) {
    const [reply, setReply] = useState("")
    const [loading, setLoading] = useState(false)
    const [chatMessages, setChatMessages] = useState<Message[]>(() => {
        const cached = getCachedMessages(ticket.id)
        if (cached && cached.length >= messages.length) return cached
        return messages
    })
    const [isOtherTyping, setIsOtherTyping] = useState(false)
    const [isAiThinking, setIsAiThinking] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(ticket.status)
    const [isAiModeActive, setIsAiModeActive] = useState(!!ticket.aiEnabled)
    const [typingAiMessageIds, setTypingAiMessageIds] = useState<Set<number>>(new Set())

    const scrollRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastTypedRef = useRef<number>(0)
    const hasScrolledInitial = useRef(false)
    const seenAiMessageIds = useRef<Set<number>>(new Set())

    // Initial scroll setup
    useEffect(() => {
        const viewed = isTicketViewed(ticket.id)
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "auto" })
            hasScrolledInitial.current = true
            markTicketViewed(ticket.id)
        }
    }, [ticket.id])

    // Sync with server props and update cache with deduplication
    useEffect(() => {
        setChatMessages(prev => {
            // Deduplicate: If we have optimistic messages that are now confirmed by server (matched by content for same user)
            // or simply use ID for confirmed messages.
            const serverMessageIds = new Set(messages.map(m => m.id))
            const serverMessageContents = new Set(messages.map(m => m.message))

            const filteredPrev = prev.filter(m => {
                // Keep if not optimistic and not duplicated by ID
                if (!m.isOptimistic) return !serverMessageIds.has(m.id)
                // If optimistic, remove if a server message with same content exists
                return !serverMessageContents.has(m.message)
            })

            const all = [...filteredPrev, ...messages]
            const uniqueMap = new Map()

            all.forEach(m => {
                uniqueMap.set(m.id, m)
            })

            const merged = Array.from(uniqueMap.values())
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

            setCachedMessages(ticket.id, merged)
            return merged
        })
    }, [messages, ticket.id])

    // SSE Realtime Listener
    useEffect(() => {
        const eventSource = new EventSource(`/api/tickets/${ticket.id}/stream`)

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                // Handle Typing Event
                if (data.type === "typing") {
                    // Show if NOT me OR if it's AI (needed for local thinking display)
                    if (data.userId !== currentUserId || data.isAi) {
                        setIsOtherTyping(true)
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000)

                        // Scroll to bottom
                        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
                    }
                    return
                }

                // Handle Message or Status Update
                if (data.type === "status_update") {
                    setCurrentStatus(data.status)
                    return
                }

                if (data.type === "ai_disabled") {
                    // Update internal state so CiaBrain stops
                    setIsAiModeActive(false)
                    return
                }

                // New message
                const newMsg = data as Message
                setChatMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev

                    // Filter out optimistic match
                    const filtered = prev.filter(m => !(m.isOptimistic && m.message === newMsg.message))

                    const updated = [...filtered, newMsg].sort((a, b) =>
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    )
                    setCachedMessages(ticket.id, updated)

                    // If this is a NEW AI message, trigger typewriter effect
                    if (newMsg.isAiReply && !seenAiMessageIds.current.has(newMsg.id)) {
                        seenAiMessageIds.current.add(newMsg.id)
                        setTypingAiMessageIds(prev => new Set([...prev, newMsg.id]))
                    }

                    return updated
                })
                setIsOtherTyping(false)
            } catch (e) {
                console.error("SSE parse error", e)
            }
        }

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            eventSource.close()
        }
    }, [ticket.id, currentUserId])

    // Auto scroll to bottom ONLY when NEW messages arrive or typing status changes
    useEffect(() => {
        if (bottomRef.current && hasScrolledInitial.current) {
            // Only use smooth for new incoming messages after initial load
            bottomRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [chatMessages.length, isOtherTyping])

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReply(e.target.value)

        const now = Date.now()
        // Broadcast max once every 2 seconds to reduce load
        if (now - lastTypedRef.current > 2000) {
            broadcastTyping(ticket.id)
            lastTypedRef.current = now
        }
    }

    const handleSend = async () => {
        if (!reply.trim()) return

        const tempId = Date.now()
        const optimisticMsg: Message = {
            id: tempId,
            isAiReply: false,
            createdAt: new Date(),
            isAdminReply: viewMode === "admin",
            user: { username: "You", role: viewMode === "admin" ? "admin" : "user" },
            isOptimistic: true,
            message: reply,
        }

        setChatMessages(prev => [...prev, optimisticMsg])
        setReply("")
        setLoading(true)

        try {
            const result = await replyTicket({
                ticketId: ticket.id,
                message: optimisticMsg.message
            })

            if (!result.success) {
                toast.error("Gagal mengirim pesan")
                // Remove optimistic message if failed
                setChatMessages(prev => prev.filter(m => m.id !== tempId))
            }
        } catch (error) {
            toast.error("Terjadi kesalahan")
            setChatMessages(prev => prev.filter(m => m.id !== tempId))
        } finally {
            setLoading(false)
        }
    }

    const isClosed = currentStatus === "closed"

    return (
        <Card className="flex flex-col flex-1 min-h-0 bg-background/50 backdrop-blur-sm border-muted/50 overflow-hidden">
            {/* Cia AI Reasoning Brain (Invisible) */}
            <CiaBrain
                ticketId={ticket.id}
                messages={chatMessages}
                aiEnabled={isAiModeActive}
                onProcessingChange={setIsAiThinking}
            />
            <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4 space-y-0 bg-muted/10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{ticket.subject}</CardTitle>
                        <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'} className="h-5 px-1.5 text-[10px] uppercase">
                            {ticket.priority}
                        </Badge>
                    </div>
                    <CardDescription className="text-xs flex items-center gap-2">
                        <span>Ticket #{ticket.id}</span>
                        <span className="text-muted-foreground/30">•</span>
                        <span>{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                    </CardDescription>
                </div>
                <Badge variant={
                    currentStatus === 'open' ? 'secondary' :
                        currentStatus === 'answered' ? 'default' : 'outline'
                } className="capitalize">
                    {currentStatus}
                </Badge>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5">
                {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm opacity-50">
                        <p>Belum ada pesan</p>
                    </div>
                ) : (
                    chatMessages.map((msg, index) => {
                        let isMe = false
                        if (viewMode === "user") {
                            isMe = !msg.isAdminReply
                        } else {
                            // In admin view, "me" is any human admin reply, BUT NOT AI
                            isMe = msg.isAdminReply && !msg.isAiReply
                        }

                        let senderName = ""
                        if (viewMode === "user") {
                            if (isMe) senderName = "Anda"
                            else senderName = msg.isAiReply ? "Cia (AI)" : "Support Team"
                        } else {
                            if (isMe) senderName = "Anda (Staff)"
                            else if (msg.isAiReply) senderName = "Cia Assistant"
                            else senderName = msg.user.username || "User"
                        }

                        const shouldAnimate = true

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full gap-3",
                                    shouldAnimate && "animate-in fade-in slide-in-from-bottom-2 duration-500",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                {!isMe && (
                                    <Avatar className={cn("h-8 w-8 mt-1 border", msg.isAiReply && "border-primary/30 shadow-sm shadow-primary/10")}>
                                        <AvatarImage src="" />
                                        <AvatarFallback className={cn("text-[10px]", msg.isAiReply && "bg-primary/5 text-primary")}>
                                            {msg.isAiReply ? <Bot className="h-4 w-4" /> : (viewMode === "user" ? <ShieldAlert className="h-4 w-4" /> : "US")}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={cn(
                                    "flex flex-col max-w-[80%]",
                                    isMe ? "items-end" : "items-start"
                                )}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className={cn("text-xs font-medium", msg.isAiReply ? "text-primary" : "text-foreground/70")}>
                                            {senderName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(msg.createdAt).toLocaleTimeString('id-id', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "relative px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                            : msg.isAiReply
                                                ? "bg-primary/[0.03] dark:bg-primary/[0.05] border border-primary/20 text-foreground rounded-2xl rounded-tl-sm shadow-inner shadow-primary/5"
                                                : "bg-white dark:bg-muted border border-border/50 text-foreground rounded-2xl rounded-tl-sm"
                                    )}>
                                        <MessageContent
                                            message={msg.message}
                                            isMe={isMe}
                                            isAiMessage={msg.isAiReply}
                                            isTyping={typingAiMessageIds.has(msg.id)}
                                            onTypingComplete={() => setTypingAiMessageIds(prev => {
                                                const next = new Set(prev)
                                                next.delete(msg.id)
                                                return next
                                            })}
                                        />
                                    </div>
                                </div>

                                {isMe && (
                                    <Avatar className="h-8 w-8 mt-1 border">
                                        <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )
                    })
                )}

                {(isOtherTyping || isAiThinking) && (
                    <div className="flex w-full gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Avatar className="h-8 w-8 mt-1 border border-primary/20 bg-primary/5">
                            <AvatarFallback className="text-[10px] text-primary">
                                <Bot className="h-4 w-4 animate-pulse" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-primary/[0.03] px-4 py-3 rounded-2xl rounded-tl-sm border border-primary/10">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-medium text-primary/60 uppercase tracking-wider">Cia is thinking</span>
                                <div className="flex gap-1 h-3 items-center">
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </CardContent>

            <CardFooter className="p-4 border-t bg-background shrink-0">
                {isClosed ? (
                    <div className="flex items-center justify-center w-full gap-2 p-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                        <CheckCheck className="h-4 w-4" />
                        <span>Tiket ini telah ditutup. Silakan buat tiket baru jika ada masalah lain.</span>
                    </div>
                ) : (
                    <div className="flex w-full items-end gap-2 p-3 border rounded-xl bg-background focus-within:ring-1 focus-within:ring-ring ring-offset-background transition-shadow shadow-sm focus-within:shadow-md">
                        <Textarea
                            value={reply}
                            onChange={handleInputChange}
                            placeholder="Tulis balasan Anda..."
                            className="flex-1 min-h-[40px] max-h-[200px] w-full resize-none border-0 p-1 shadow-none focus-visible:ring-0 bg-transparent text-sm leading-relaxed"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-lg shrink-0 transition-all",
                                reply.trim()
                                    ? "bg-primary text-primary-foreground opacity-100 scale-100"
                                    : "bg-muted text-muted-foreground opacity-50 scale-95"
                            )}
                            onClick={handleSend}
                            disabled={loading}
                        >
                            {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

function MessageContent({
    message,
    isMe,
    isAiMessage = false,
    isTyping = false,
    onTypingComplete
}: {
    message: string
    isMe: boolean
    isAiMessage?: boolean
    isTyping?: boolean
    onTypingComplete?: () => void
}) {
    // Check for JSON blocks (support multiple)
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g
    const matches = Array.from(message.matchAll(jsonRegex))

    let cleanMessage = message
    const structuredItems: any[] = []

    matches.forEach(match => {
        try {
            const data = JSON.parse(match[1])
            structuredItems.push(data)
            cleanMessage = cleanMessage.replace(match[0], "")
        } catch (e) {
            console.warn("Card parse error", e)
        }
    })

    // Clean up raw tool call data that shouldn't be shown to users
    // Pattern: toolName: [{...}] or toolName: {...}
    cleanMessage = cleanMessage.replace(/\b(get\w+|check\w+|close\w+|disable\w+):\s*\[[\s\S]*?\]/gi, '')
    cleanMessage = cleanMessage.replace(/\b(get\w+|check\w+|close\w+|disable\w+):\s*\{[\s\S]*?\}/gi, '')
    // Pattern: [{"id":...}] standalone JSON arrays
    cleanMessage = cleanMessage.replace(/^\s*\[\s*\{[^}]+\}[\s\S]*?\]\s*/gm, '')
    // Pattern: {"id":...} standalone JSON objects at start of line
    cleanMessage = cleanMessage.replace(/^\s*\{[^}]+\}\s*/gm, '')

    cleanMessage = cleanMessage.trim()

    // Use TypewriterText for AI messages that are typing
    const shouldUseTypewriter = isAiMessage && isTyping && cleanMessage.length > 0

    return (
        <div className="space-y-4">
            {cleanMessage && (
                <div className={cn(
                    "prose prose-sm dark:prose-invert max-w-none leading-relaxed break-words markdown-content",
                    isMe ? "text-primary-foreground prose-p:text-primary-foreground prose-strong:text-white" : "text-foreground"
                )}>
                    {shouldUseTypewriter ? (
                        <TypewriterText
                            text={cleanMessage}
                            speed={12}
                            onComplete={onTypingComplete}
                        />
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {cleanMessage}
                        </ReactMarkdown>
                    )}
                </div>
            )}

            {structuredItems.length > 0 && (
                <div className="space-y-3 pt-2">
                    {structuredItems.map((item, idx) => {
                        if (item.type === "order_detail") {
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "rounded-2xl overflow-hidden border shadow-xl duration-300 animate-in fade-in slide-in-from-bottom-3",
                                        isMe ? "bg-white/10 border-white/20 backdrop-blur-md" : "bg-card border-border/50"
                                    )}
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-5 py-3 border-b border-primary/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4 text-primary" />
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">Detail Transaksi</span>
                                        </div>
                                        <Badge
                                            variant={item.data.status?.toLowerCase() === 'sukses' ? 'default' : 'outline'}
                                            className={cn(
                                                "text-[10px] h-5 px-2 font-bold",
                                                item.data.status?.toLowerCase() === 'sukses' && "bg-green-500 hover:bg-green-600 border-none",
                                                item.data.status?.toLowerCase() === 'expired' && "bg-destructive/10 text-destructive border-destructive/20"
                                            )}
                                        >
                                            {item.data.status || 'Checking'}
                                        </Badge>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] opacity-50 flex items-center gap-1 font-medium">
                                                    <Tag className="h-3 w-3" /> PRODUK
                                                </span>
                                                <p className="text-sm font-bold truncate">{item.data.product}</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[10px] opacity-50 flex items-center gap-1 justify-end font-medium">
                                                    <Clock className="h-3 w-3" /> ORDER ID
                                                </span>
                                                <p className="text-[11px] font-mono font-medium tracking-tight opacity-90">{item.data.orderId}</p>
                                            </div>
                                        </div>

                                        <Separator className="opacity-20" />

                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <span className="text-[10px] opacity-50 flex items-center gap-1 font-medium text-emerald-500/80">
                                                    <CreditCard className="h-3 w-3" /> TOTAL BAYAR
                                                </span>
                                                <p className="text-2xl font-black tracking-tight text-primary">
                                                    {(() => {
                                                        const rawPrice = item.data.price;
                                                        if (!rawPrice) return "Rp 0";
                                                        if (typeof rawPrice === 'string' && rawPrice.includes('Rp')) {
                                                            return rawPrice;
                                                        }
                                                        const numPrice = Number(String(rawPrice).replace(/[^\d.-]/g, ''));
                                                        if (isNaN(numPrice)) return "Rp 0";
                                                        return `Rp ${numPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                                                    })()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] opacity-40 font-medium">
                                                    {item.data.date ? new Date(item.data.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {item.data.deliveryStatus &&
                                            !['expired', 'cancelled', 'failed', 'pending'].includes(item.data.status?.toLowerCase()) && (
                                                <div className="mt-2 bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-start gap-3">
                                                    <div className="mt-0.5 bg-primary/20 p-1 rounded-full text-primary">
                                                        <CheckCheck className="h-3 w-3" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-[9px] font-bold text-primary/60 uppercase">Informasi Pengiriman</span>
                                                        <p className="text-[11px] leading-relaxed opacity-90">{item.data.deliveryStatus}</p>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )
                        }

                        if (item.type === "deposit_detail") {
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "rounded-xl overflow-hidden border shadow-sm duration-300 animate-in fade-in slide-in-from-bottom-3",
                                        isMe ? "bg-white/5 border-white/10 backdrop-blur-sm" : "bg-card border-border/40"
                                    )}
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    {/* Header Compact */}
                                    <div className="bg-muted/30 px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="p-1 rounded bg-primary/10 text-primary">
                                                <CreditCard className="h-3 w-3" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deposit</span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[9px] h-4 px-1.5 font-bold uppercase border-0",
                                                item.data.status?.toLowerCase() === 'pending' && "bg-yellow-500/10 text-yellow-500",
                                                item.data.status?.toLowerCase() === 'success' && "bg-emerald-500/10 text-emerald-500",
                                                item.data.status?.toLowerCase() === 'expired' && "bg-destructive/10 text-destructive"
                                            )}
                                        >
                                            {item.data.status || 'Pending'}
                                        </Badge>
                                    </div>

                                    {/* Content Compact */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    Payment Method
                                                </p>
                                                <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                                                    {item.data.paymentChannel || item.data.payment}
                                                </p>
                                                <p className="text-[10px] font-mono text-muted-foreground pt-0.5">
                                                    {item.data.trxId || item.data.id}
                                                </p>
                                            </div>

                                            <div className="text-right space-y-0.5">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase">Total Tagihan</p>
                                                <p className="text-lg font-bold text-primary tracking-tight">
                                                    {item.data.totalBayar || item.data.amount}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {item.data.date ? new Date(item.data.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {item.data.status?.toLowerCase() === 'pending' && item.data.payUrl && (
                                            <>
                                                <Separator className="opacity-10" />
                                                <a
                                                    href={item.data.payUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg text-xs font-bold transition-all w-full"
                                                >
                                                    Bayar Sekarang ⚡
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        }

                        if (item.type === "product_list") {
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "rounded-xl overflow-hidden border shadow-sm duration-300 animate-in fade-in slide-in-from-bottom-3",
                                        isMe ? "bg-white/5 border-white/10 backdrop-blur-sm" : "bg-card border-border/40"
                                    )}
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="bg-muted/30 px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
                                        <div className="p-1 rounded bg-purple-500/10 text-purple-500">
                                            <Tag className="h-3 w-3" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product List</span>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {item.data.products?.map((prod: any, pIdx: number) => (
                                            <div key={pIdx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className={cn(
                                                        "h-8 w-8 p-0 flex items-center justify-center font-bold text-[10px]",
                                                        prod.variant === 'KVIP' ? "border-amber-500/30 text-amber-500 bg-amber-500/5" : "border-primary/30 text-primary bg-primary/5"
                                                    )}>
                                                        {prod.variant === 'KVIP' ? 'K' : 'V'}
                                                    </Badge>
                                                    <div>
                                                        <p className="text-xs font-bold">{prod.name}</p>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            Stock: <span className={prod.stock > 0 ? "text-emerald-500 font-medium" : "text-destructive"}>{prod.stock}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-foreground">{prod.price}</p>
                                                    <a href="/products" className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary font-medium hover:underline inline-flex items-center gap-0.5">
                                                        Beli <ArrowRight className="h-2 w-2" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                        <Separator className="my-1 opacity-10" />
                                        <a href="/products" className="block text-center text-xs font-medium text-muted-foreground hover:text-primary py-1 transition-colors">
                                            Lihat semua produk
                                        </a>
                                    </div>
                                </div>
                            )
                        }

                        return null;
                    })}
                </div>
            )}
        </div>
    )
}
