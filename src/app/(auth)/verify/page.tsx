"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { MailCheck, CheckCircle, XCircle, Loader2 } from "lucide-react"
// import { api } from "@/lib/api"

function VerifyPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")
    const [email, setEmail] = useState("")
    const [resendLoading, setResendLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [canResend, setCanResend] = useState(false)

    const COOLDOWN_SECONDS = 60

    // Sync email from search params
    useEffect(() => {
        const emailParam = searchParams.get("email")
        if (emailParam) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEmail(emailParam)
        }
    }, [searchParams])

    // Load/Update cooldown from localStorage
    useEffect(() => {
        if (!email) return

        const checkCooldown = () => {
            const storageKey = `resend_cooldown_${email}`
            const lastSent = localStorage.getItem(storageKey)

            if (lastSent) {
                const diff = Math.floor((Date.now() - parseInt(lastSent)) / 1000)
                if (diff < COOLDOWN_SECONDS) {
                    setCountdown(COOLDOWN_SECONDS - diff)
                    setCanResend(false)
                    return
                }
            }
            setCountdown(0)
            setCanResend(true)
        }

        checkCooldown()
        const interval = setInterval(checkCooldown, 1000)
        return () => clearInterval(interval)
    }, [email])

    // Auto-verify if token is present in URL
    const verifyEmail = async (verificationToken: string) => {
        setStatus("loading")
        try {
            // Stub simulation
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _token = verificationToken
            await new Promise(resolve => setTimeout(resolve, 1000))
            const result = { success: false, data: { message: "" }, error: "Backend pending" };

            if (result.success) {
                setStatus("success")
                setMessage(result.data?.message || "Email verified successfully! You can now login.")
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            } else {
                setStatus("error")
                setMessage(result.error || "Verification failed")
            }
        } catch (error) {
            setStatus("error")
            setMessage("Something went wrong")
        }
    }

    useEffect(() => {
        if (token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            verifyEmail(token)
        }
    }, [token])

    const handleResend = async () => {
        if (!email || !canResend) return
        setResendLoading(true)
        try {
            const result = { success: false, data: { message: "" }, error: "Backend pending" };

            if (result.success) {
                setMessage(result.data?.message || "Link verifikasi telah dikirim ulang")
                localStorage.setItem(`resend_cooldown_${email}`, Date.now().toString())
                setCanResend(false)
                setCountdown(COOLDOWN_SECONDS)
            } else {
                setStatus("error")
                setMessage(result.error || "Gagal mengirim ulang email")
            }
        } catch {
            setStatus("error")
            setMessage("Terjadi kesalahan")
        }
        setResendLoading(false)
    }

    // Show verification result if token was provided
    if (token) {
        return (
            <div className="flex flex-col gap-6">
                <Link href="/" className="flex items-center gap-2 self-center font-medium">
                    <img src="/logo.png" alt="Redfinger Icon" className="h-6 w-auto" />
                    Redfinger
                </Link>
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            {status === "loading" && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
                            {status === "success" && <CheckCircle className="h-8 w-8 text-green-500" />}
                            {status === "error" && <XCircle className="h-8 w-8 text-red-500" />}
                        </div>
                        <CardTitle>
                            {status === "loading" && "Memverifikasi..."}
                            {status === "success" && "Email Terverifikasi!"}
                            {status === "error" && "Verifikasi Gagal"}
                        </CardTitle>
                        <CardDescription>
                            {message}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status === "success" && (
                            <p className="text-center text-sm text-muted-foreground">
                                Anda akan diarahkan ke halaman login dalam beberapa detik...
                            </p>
                        )}
                        {status === "error" && (
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/login">
                                    Kembali ke Login
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Default view: waiting for email verification
    return (
        <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 self-center font-medium">
                <img src="/logo.png" alt="Redfinger Icon" className="h-6 w-auto" />
                Redfinger
            </Link>
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <MailCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Verifikasi Email</CardTitle>
                    <CardDescription>
                        Kami telah mengirimkan link verifikasi ke email:
                        <br />
                        <span className="font-semibold text-foreground">{email || "Email Anda"}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-sm text-muted-foreground">
                        Silakan cek inbox email Anda dan klik link verifikasi untuk mengaktifkan akun.
                        Jika tidak menemukan email, cek folder spam.
                    </p>

                    {message && (
                        <div className={`p-3 rounded-md text-center text-sm ${status === "error" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                            {message}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleResend}
                            disabled={resendLoading || !canResend || !email}
                        >
                            {resendLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {canResend ? "Kirim Ulang Email" : `Kirim Ulang (${countdown}s)`}
                        </Button>
                    </div>

                    <Button variant="ghost" className="w-full" asChild>
                        <Link href="/login">
                            Kembali ke Login
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 self-center font-medium">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <VerifyPageContent />
        </Suspense>
    )
}
