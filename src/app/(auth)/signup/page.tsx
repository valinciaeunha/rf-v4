import { SignupForm } from "@/components/signup-form"

import Link from "next/link"

export default function SignupPage() {
    return (
        <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 self-center font-medium">
                <img src="/logo.png" alt="Redfinger Icon" className="h-6 w-auto" />
                Redfinger
            </Link>
            <SignupForm />
        </div>
    )
}
