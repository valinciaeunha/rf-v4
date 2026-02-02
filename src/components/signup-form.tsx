"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerAction } from "@/lib/actions/auth"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [whatsapp, setWhatsapp] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [errorField, setErrorField] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setErrorField(null)

        // Client-side validation
        if (password.length < 8) {
            setError("Password minimal 8 karakter")
            setErrorField("password")
            setLoading(false)
            return
        }

        try {
            const formData = new FormData()
            formData.append("username", username)
            formData.append("email", email)
            formData.append("password", password)
            if (whatsapp) formData.append("whatsapp", whatsapp)

            const result = await registerAction(formData)

            if (result.success) {
                // Auto login handled by action, just redirect
                router.push("/dashboard")
                router.refresh()
            } else {
                const errMsg = result.error || "Registrasi gagal"
                setError(errMsg)
                if (errMsg.toLowerCase().includes("email")) {
                    setErrorField("email")
                } else if (errMsg.toLowerCase().includes("username")) {
                    setErrorField("username")
                } else {
                    setErrorField("password")
                }
            }
        } catch {
            setError("Terjadi kesalahan jaringan")
            setErrorField("username")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                    Enter your information below to create your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="username">Username</FieldLabel>
                            <Input
                                id="username"
                                type="text"
                                placeholder="johndoe"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(null); setErrorField(null) }}
                                disabled={loading}
                                aria-invalid={errorField === "username"}
                                required
                            />
                            {errorField === "username" && error && (
                                <FieldError>{error}</FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(null); setErrorField(null) }}
                                disabled={loading}
                                aria-invalid={errorField === "email"}
                                required
                            />
                            {errorField === "email" && error && (
                                <FieldError>{error}</FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="whatsapp">WhatsApp Number (Optional)</FieldLabel>
                            <Input
                                id="whatsapp"
                                type="tel"
                                placeholder="62812..."
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                disabled={loading}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(null); setErrorField(null) }}
                                disabled={loading}
                                aria-invalid={errorField === "password"}
                                required
                            />
                            {errorField === "password" && error && (
                                <FieldError>{error}</FieldError>
                            )}
                        </Field>
                        <FieldGroup>
                            <Field>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Creating Account..." : "Create Account"}
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] hover:text-white text-white border-none"
                                    onClick={() => window.location.href = "/api/auth/discord"}
                                >
                                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                    Sign up with Discord
                                </Button>
                                <FieldDescription className="text-center">
                                    Already have an account? <Link href="/login" className="underline underline-offset-4">Sign in</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
