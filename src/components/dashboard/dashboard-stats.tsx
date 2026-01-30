"use client"

export function DashboardStats() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
                <h4 className="text-sm font-medium text-muted-foreground">Balance</h4>
                <p className="text-2xl font-bold">Rp 0</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
                <h4 className="text-sm font-medium text-muted-foreground">Keys Owned</h4>
                <p className="text-2xl font-bold">0</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
                <h4 className="text-sm font-medium text-muted-foreground">Transactions</h4>
                <p className="text-2xl font-bold">0</p>
            </div>
        </div>
    )
}
