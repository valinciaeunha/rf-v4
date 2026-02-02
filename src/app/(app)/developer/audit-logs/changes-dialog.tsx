"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface ChangesDialogProps {
    changes: string | null
    action: string
    targetType: string
    targetId: number | null
}

export function ChangesDialog({ changes, action, targetType, targetId }: ChangesDialogProps) {
    const [open, setOpen] = useState(false)

    if (!changes) {
        return <span className="text-muted-foreground">-</span>
    }

    let parsedChanges = {}
    try {
        parsedChanges = JSON.parse(changes)
    } catch {
        parsedChanges = { raw: changes }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="h-7 px-2 text-xs"
            >
                <Eye className="h-3 w-3 mr-1" />
                View
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Changes: {action}
                        </DialogTitle>
                        <DialogDescription>
                            {targetType} {targetId ? `#${targetId}` : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
                            {JSON.stringify(parsedChanges, null, 2)}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
