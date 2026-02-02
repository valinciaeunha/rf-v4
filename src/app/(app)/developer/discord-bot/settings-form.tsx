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
import { toast } from "sonner"
import { updateBotSettings } from "@/lib/actions/bot-settings"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const schema = z.object({
    guildId: z.string().min(1, "Guild ID is required"),
    publicLogChannelId: z.string().optional(),
    privateLogChannelId: z.string().optional(),
    expiredLogChannelId: z.string().optional(),
})

interface SettingsFormProps {
    initialData: any
    defaultGuildId: string
}

export function BotSettingsForm({ initialData, defaultGuildId }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            guildId: initialData?.guildId || defaultGuildId || "",
            publicLogChannelId: initialData?.publicLogChannelId || "",
            privateLogChannelId: initialData?.privateLogChannelId || "",
            expiredLogChannelId: initialData?.expiredLogChannelId || "",
        },
    })

    async function onSubmit(data: z.infer<typeof schema>) {
        setLoading(true)
        try {
            const result = await updateBotSettings({
                guildId: data.guildId,
                publicLogChannelId: data.publicLogChannelId || "",
                privateLogChannelId: data.privateLogChannelId || "",
                expiredLogChannelId: data.expiredLogChannelId || "",
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
                                <Input placeholder="123456789..." {...field} />
                            </FormControl>
                            <FormDescription>
                                The ID of the Discord Server (Guild) where the bot is active.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="publicLogChannelId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Public Log Channels</FormLabel>
                            <FormControl>
                                <Input placeholder="ChannelID1, ChannelID2..." {...field} />
                            </FormControl>
                            <FormDescription>
                                Censored transaction logs will be sent here. Separate multiple IDs with commas.
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
                            <FormLabel>Private Log Channels</FormLabel>
                            <FormControl>
                                <Input placeholder="ChannelID1, ChannelID2..." {...field} />
                            </FormControl>
                            <FormDescription>
                                Full transaction logs (with stock data) will be sent here. Separate multiple IDs with commas.
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
                            <FormLabel>Expired Log Channel</FormLabel>
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

                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </form>
        </Form>
    )
}
