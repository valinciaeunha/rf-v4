import React from "react"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-10 overflow-hidden bg-background">
            {/* Animated Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute inset-0 w-full h-[200%] bg-grid-pattern opacity-20"></div>
            </div>

            {/* Blurred Logo Background */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <img
                    src="/logo.png"
                    alt="Background Logo"
                    className="w-full h-full object-cover opacity-10 blur-sm scale-150"
                />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-sm">
                {children}
            </div>
        </div>
    )
}
