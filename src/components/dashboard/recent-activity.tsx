"use client"

export function RecentActivity() {
    return (
        <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4 text-muted-foreground">
                <p>No recent activity</p>
            </div>
        </div>
    )
}
