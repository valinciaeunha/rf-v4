import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function AdminTicketLoading() {
    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 p-4 md:p-6 gap-4 h-full">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg lg:hidden" />
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                    <Card className="flex flex-col flex-1 min-h-0 bg-background/50 backdrop-blur-sm border-muted/50 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4 space-y-0 bg-muted/10 shrink-0">
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`flex w-full gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                                    <div className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                        <Skeleton className="h-3 w-20 mb-2 px-1" />
                                        <Skeleton className={`h-16 w-[200px] md:w-[300px] rounded-2xl ${i % 2 === 0 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} />
                                    </div>
                                    {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                                </div>
                            ))}
                        </CardContent>

                        <CardFooter className="p-4 border-t bg-background shrink-0">
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Right Sidebar - Desktop Only */}
            <div className="hidden lg:block w-80 border-l bg-muted/10 shrink-0 h-full overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </div>
                <Separator />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function Separator() {
    return <div className="h-px bg-border/50 w-full" />
}
