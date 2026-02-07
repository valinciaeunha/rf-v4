'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateBotSettings } from "@/lib/actions/bot-settings"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const schema = z.object({
    guildId: z.string().min(1, "Guild ID is required").default("default"),
    publicLogChannelId: z.string().default(""),
    privateLogChannelId: z.string().default(""),
    expiredLogChannelId: z.string().default(""),
    aiChatEnabled: z.boolean().default(true),
    aiChatCategoryIds: z.string().default(""),
})

type SettingsFormValues = z.infer<typeof schema>

interface SettingsFormProps {
    initialData: any
    defaultGuildId: string
}

export function BotSettingsForm({ initialData, defaultGuildId }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)

    // Fallback to "default" if no ID provided
    const activeGuildId = initialData?.guildId || defaultGuildId || ""

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            guildId: activeGuildId,
            publicLogChannelId: initialData?.publicLogChannelId || "",
            privateLogChannelId: initialData?.privateLogChannelId || "",
            expiredLogChannelId: initialData?.expiredLogChannelId || "",
            aiChatEnabled: initialData?.aiChatEnabled ?? true,
            aiChatCategoryIds: initialData?.aiChatCategoryIds || "",
        },
    })

    async function onSubmit(data: SettingsFormValues) {
        setLoading(true)
        try {
            const result = await updateBotSettings({
                guildId: data.guildId,
                publicLogChannelId: data.publicLogChannelId || "",
                privateLogChannelId: data.privateLogChannelId || "",
                expiredLogChannelId: data.expiredLogChannelId || "",
                aiChatEnabled: data.aiChatEnabled,
                aiChatCategoryIds: data.aiChatCategoryIds || "",
            })

            if (result.success) {
                toast.success("Settings updated successfully")
            } else {
                toast.error("Failed to update settings")
            }
        } catch (error) {
            toast.error("Something went wrong")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="guildId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Guild ID</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter Discord Server ID" {...field} />
                            </FormControl>
                            <FormDescription>
                                The Discord Server ID this configuration applies to.
                                <br />
                                <span className="text-xs text-yellow-500">
                                    Note: Changing this and saving will create/update settings for the new Server ID.
                                </span>
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="aiChatEnabled"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">AI Chat</FormLabel>
                                    <FormDescription>
                                        Enable/Disable AI Chat in Discord.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="aiChatCategoryIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>AI Chat Categories</FormLabel>
                                <FormControl>
                                    <Input placeholder="CatID1, CatID2..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Comma separated Category IDs where AI Chat is active.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 rounded-lg border p-4 shadow-sm bg-muted/20">
                    <h3 className="font-medium">Log Channels</h3>
                    <FormField
                        control={form.control}
                        name="publicLogChannelId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Public Logs</FormLabel>
                                <FormControl>
                                    <Input placeholder="ChannelID1, ChannelID2..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Censored transaction logs.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="privateLogChannelId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Private Logs</FormLabel>
                                <FormControl>
                                    <Input placeholder="ChannelID1, ChannelID2..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Full transaction logs (with stock data).
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="expiredLogChannelId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Expired/Failed Logs</FormLabel>
                                <FormControl>
                                    <Input placeholder="ChannelID..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Notifications for expired or failed transactions.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </form>
        </Form>
    )
}
