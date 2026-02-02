import { LoginForm } from "@/components/login-form"
import { Suspense } from "react"
import Link from "next/link"

function LoginFormFallback() {
    return (
        <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 self-center font-medium">
                <img src="/logo.png" alt="Redfinger Icon" className="h-6 w-auto" />
                Redfinger
            </Link>
            <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
