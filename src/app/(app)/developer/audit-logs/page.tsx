import { getAuditLogs } from "@/lib/actions/developer"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/actions/auth"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText } from "lucide-react"
import { ChangesDialog } from "./changes-dialog"

export default async function AuditLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string }>
}) {
    // Verify developer access
    const session = await getSessionUser()
    if (!session || session.role !== "developer") {
        redirect("/dashboard")
    }

    const params = await searchParams
    const page = parseInt(params.page || "1")
    const search = params.search || ""

    const result = await getAuditLogs({ page, limit: 20, search })

    if (!result.success) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Error loading audit logs</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { data: logs, pagination } = result

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getActionBadgeColor = (action: string) => {
        if (action.includes("delete")) return "destructive"
        if (action.includes("update")) return "warning"
        if (action.includes("create")) return "default"
        return "secondary"
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <ScrollText className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track all administrative actions in the system
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>
                        Showing {logs?.length || 0} of {pagination?.total || 0} entries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {logs && logs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Performed By</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap text-sm">
                                            {formatDate(log.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionBadgeColor(log.action) as "destructive" | "default" | "secondary" | "outline"}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">{log.targetType}</span>
                                                {log.targetId && (
                                                    <span className="ml-1 text-xs">#{log.targetId}</span>
                                                )}
                                                {log.targetUserName && (
                                                    <div className="mt-1">
                                                        <p className="font-medium">{log.targetUserName}</p>
                                                        <p className="text-xs text-muted-foreground">{log.targetUserEmail}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="font-medium">{log.performedByName}</p>
                                                <p className="text-xs text-muted-foreground">{log.performedByEmail}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {log.ipAddress || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <ChangesDialog
                                                changes={log.changes}
                                                action={log.action}
                                                targetType={log.targetType}
                                                targetId={log.targetId}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                        <a
                            key={p}
                            href={`/developer/audit-logs?page=${p}${search ? `&search=${search}` : ""}`}
                            className={`px-3 py-1 rounded ${p === page
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            {p}
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}
