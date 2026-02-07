import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { BotSettingsForm } from "./settings-form"
import { getBotSettings } from "@/lib/actions/bot-settings"

// Default Guild ID could be ENV or User Input.
// For now, let's allow user to input.
const DEFAULT_GUILD_ID = process.env.DISCORD_GUILD_ID || ""

export default async function DiscordBotSettingsPage({
    searchParams,
}: {
    searchParams: { guildId?: string }
}) {
    const targetGuildId = searchParams?.guildId || DEFAULT_GUILD_ID
    const settings = await getBotSettings(targetGuildId)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Discord Bot</h2>
                    <p className="text-muted-foreground">
                        Manage notification channels and bot configuration.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Channel Configuration</CardTitle>
                        <CardDescription>
                            Configure where the bot sends logs and notifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BotSettingsForm
                            initialData={settings}
                            defaultGuildId={targetGuildId}
                        />
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Information</CardTitle>
                        <CardDescription>
                            Guide on how to configure channels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="space-y-2">
                            <strong className="text-foreground">Public Log Channels</strong>
                            <p>
                                Comma-separated list of Channel IDs. Messages here will have the Transaction ID censored (e.g. `TRX-12xxxxx`).
                            </p>
                        </div>
                        <div className="space-y-2">
                            <strong className="text-foreground">Private Log Channels</strong>
                            <p>
                                Comma-separated list of Channel IDs. Full details + Stock Data will be sent here.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <strong className="text-foreground">Expired Log Channel</strong>
                            <p>
                                Single Channel ID. Notifications for expired/failed transactions will be sent here.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
