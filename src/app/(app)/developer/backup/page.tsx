"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Database, Download, Loader2, FileJson,
    Upload, AlertTriangle, RotateCcw, HardDrive
} from "lucide-react"
import { getDatabaseBackup, getBackupStats } from "@/lib/actions/developer"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function BackupPage() {
    const [isExporting, setIsExporting] = useState(false)
    const [isDumping, setIsDumping] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)
    const [stats, setStats] = useState<Record<string, number> | null>(null)
    const [isLoadingStats, setIsLoadingStats] = useState(true)

    // Restore dialog state
    const [showRestoreDialog, setShowRestoreDialog] = useState(false)
    const [restoreFile, setRestoreFile] = useState<File | null>(null)
    const [confirmPhrase, setConfirmPhrase] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        setIsLoadingStats(true)
        const result = await getBackupStats()
        if (result.success) {
            setStats(result.data ?? null)
        }
        setIsLoadingStats(false)
    }

    // JSON Export
    const handleBackup = async () => {
        setIsExporting(true)
        const loadingToast = toast.loading("Generating JSON export...")

        try {
            const result = await getDatabaseBackup()

            if (!result.success) {
                toast.error(result.error || "Backup failed", { id: loadingToast })
                return
            }

            const blob = new Blob([JSON.stringify(result.data, null, 2)], {
                type: "application/json",
            })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `redfinger_data_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success("JSON exported!", { id: loadingToast })
        } catch (error) {
            console.error(error)
            toast.error("Export failed", { id: loadingToast })
        } finally {
            setIsExporting(false)
        }
    }

    // PostgreSQL Dump
    const handlePgDump = async () => {
        setIsDumping(true)
        const loadingToast = toast.loading("Generating SQL dump...")

        try {
            const response = await fetch('/api/developer/backup', { method: 'GET' })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.error || "pg_dump failed", { id: loadingToast })
                return
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/)
                if (match) filename = match[1]
            }

            const link = document.createElement("a")
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success("SQL dump downloaded!", { id: loadingToast })
        } catch (error) {
            console.error(error)
            toast.error("pg_dump failed", { id: loadingToast })
        } finally {
            setIsDumping(false)
        }
    }

    // Restore (SQL)
    const handleSqlRestore = async () => {
        const loadingToast = toast.loading("Restoring from SQL...")

        try {
            const formData = new FormData()
            formData.append('file', restoreFile!)
            formData.append('confirmPhrase', confirmPhrase)

            const response = await fetch('/api/developer/restore', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                toast.error(result.message || result.error || "Restore failed", { id: loadingToast })
                return
            }

            toast.success("Database restored from SQL!", { id: loadingToast })
            closeRestoreDialog()
            fetchStats()
        } catch (error) {
            console.error(error)
            toast.error("Restore failed", { id: loadingToast })
        }
    }

    // Restore (JSON)
    const handleJsonRestore = async () => {
        const loadingToast = toast.loading("Restoring from JSON...")

        try {
            const fileContent = await restoreFile!.text()
            const jsonData = JSON.parse(fileContent)

            if (!jsonData.tables) {
                toast.error("Invalid JSON format", { id: loadingToast })
                return
            }

            const { restoreFromJson } = await import("@/lib/actions/restore")
            const result = await restoreFromJson(jsonData, confirmPhrase)

            if (!result.success) {
                toast.error(result.error || "Restore failed", { id: loadingToast })
                return
            }

            toast.success("Database restored from JSON!", { id: loadingToast })
            closeRestoreDialog()
            fetchStats()
        } catch (error: any) {
            console.error(error)
            if (error instanceof SyntaxError) {
                toast.error("Invalid JSON file", { id: loadingToast })
            } else {
                toast.error(error.message || "Restore failed", { id: loadingToast })
            }
        }
    }

    const handleRestore = async () => {
        if (!restoreFile || confirmPhrase !== "RESTORE DATABASE") return

        setIsRestoring(true)

        if (restoreFile.name.endsWith('.sql')) {
            await handleSqlRestore()
        } else if (restoreFile.name.endsWith('.json')) {
            await handleJsonRestore()
        } else {
            toast.error("Unsupported file format. Use .sql or .json")
        }

        setIsRestoring(false)
    }

    const closeRestoreDialog = () => {
        setShowRestoreDialog(false)
        setRestoreFile(null)
        setConfirmPhrase("")
    }

    const tableList = stats
        ? Object.entries(stats).filter(([key]) => key !== 'total').map(([key, count]) => ({ key, count }))
        : []

    const totalRecords = stats?.total || tableList.reduce((acc, t) => acc + t.count, 0)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <HardDrive className="h-6 w-6 text-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Database Backup</h2>
                        <p className="text-muted-foreground text-sm">
                            Backup and restore your database
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats & Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Stats Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Database Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total records across {tableList.length} tables
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* SQL Dump Action */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            SQL Dump
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Full database backup with pg_dump
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handlePgDump}
                            disabled={isDumping}
                            className="w-full"
                            size="sm"
                        >
                            {isDumping ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Download .sql
                        </Button>
                    </CardContent>
                </Card>

                {/* JSON Export Action */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            JSON Export
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Export data as JSON file
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleBackup}
                            disabled={isExporting}
                            variant="outline"
                            className="w-full"
                            size="sm"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Download .json
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Table Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Table Overview</CardTitle>
                    <CardDescription>
                        Record count per table
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingStats ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Table</TableHead>
                                    <TableHead className="text-right">Records</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableList.map(({ key, count }) => (
                                    <TableRow key={key}>
                                        <TableCell className="font-mono text-sm">{key}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {count.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Restore Section */}
            <Card className="border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                        <RotateCcw className="h-4 w-4" />
                        Restore Database
                    </CardTitle>
                    <CardDescription>
                        Upload .sql or .json backup file to restore
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 inline mr-2 text-destructive" />
                            This will overwrite all existing data
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowRestoreDialog(true)}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Restore
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Restore Dialog */}
            <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Restore Database
                        </DialogTitle>
                        <DialogDescription>
                            This will overwrite all existing data with the backup file.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="restore-file">Backup File (.sql or .json)</Label>
                            <Input
                                id="restore-file"
                                type="file"
                                accept=".sql,.json"
                                ref={fileInputRef}
                                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                            />
                            {restoreFile && (
                                <p className="text-xs text-muted-foreground">
                                    {restoreFile.name} ({(restoreFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-phrase">
                                Type <code className="bg-muted px-1 rounded text-xs">RESTORE DATABASE</code> to confirm
                            </Label>
                            <Input
                                id="confirm-phrase"
                                placeholder="RESTORE DATABASE"
                                value={confirmPhrase}
                                onChange={(e) => setConfirmPhrase(e.target.value)}
                                className={cn(
                                    confirmPhrase === "RESTORE DATABASE" && "border-green-500"
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeRestoreDialog}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRestore}
                            disabled={!restoreFile || confirmPhrase !== "RESTORE DATABASE" || isRestoring}
                        >
                            {isRestoring ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restore Now
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
