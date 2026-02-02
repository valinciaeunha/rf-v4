import { db } from "@/lib/db";
import { botSettings, products, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

const DISCORD_API = "https://discord.com/api/v10";

// Helper to send message directly via REST API (bypassing Client)
export async function sendDiscordSuccessLog(data: {
    transaction: any;
    productName: string;
    stockContent: string;
    user: { username: string; discordId?: string | null };
}) {
    try {
        const { transaction, productName, stockContent, user } = data;
        const { publicLogChannelId, privateLogChannelId, botToken } = await getSettings();

        if (!botToken) return;

        const publicEmbed = {
            title: "✅ Transaksi Sukses",
            color: 0x00FF00,
            fields: [
                { name: "Produk", value: productName, inline: true },
                { name: "Harga", value: `Rp${Number(transaction.price).toLocaleString('id-ID')}`, inline: true },
                { name: "Pembeli", value: user.username, inline: true },
                { name: "Order ID", value: transaction.orderId, inline: false },
                { name: "Metode", value: transaction.paymentMethod, inline: false },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Redfinger Store System" }
        };

        const privateEmbed = {
            title: "✅ Transaksi Sukses (Private Log)",
            color: 0x00FF00,
            description: `Order ID: **${transaction.orderId}**\nPembeli: <@${user.discordId || 'WebUser'}> (${user.username})\nProduk: ${productName}`,
            fields: [
                { name: "Stock/Data", value: `\`\`\`${stockContent.substring(0, 1000)}\`\`\`` }
            ],
            timestamp: new Date().toISOString()
        };

        // Handle multiple channel IDs (comma-separated)
        if (publicLogChannelId) {
            const ids = publicLogChannelId.split(',').map(id => id.trim()).filter(Boolean);
            for (const channelId of ids) {
                await postToDiscord(channelId, { embeds: [publicEmbed] }, botToken);
            }
        }
        if (privateLogChannelId) {
            const ids = privateLogChannelId.split(',').map(id => id.trim()).filter(Boolean);
            for (const channelId of ids) {
                await postToDiscord(channelId, { embeds: [privateEmbed] }, botToken);
            }
        }

    } catch (error) {
        logger.error("Discord Logger Error:", error);
    }
}

export async function sendDiscordDepositLog(data: {
    deposit: any;
    user: { username: string; discordId?: string | null };
}) {
    try {
        const { deposit, user } = data;
        const { publicLogChannelId, privateLogChannelId, botToken } = await getSettings();

        if (!botToken) return;

        const embed = {
            title: "💰 Deposit Berhasil",
            color: 0x00AAFF, // Blue
            fields: [
                { name: "User", value: user.username, inline: true },
                { name: "Nominal", value: `Rp${Number(deposit.amount).toLocaleString('id-ID')}`, inline: true },
                { name: "Reff ID", value: deposit.refId, inline: false },
                { name: "Metode", value: deposit.paymentChannel, inline: false },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Redfinger Store System" }
        };

        // Handle multiple channel IDs (comma-separated)
        if (publicLogChannelId) {
            const ids = publicLogChannelId.split(',').map(id => id.trim()).filter(Boolean);
            for (const channelId of ids) {
                await postToDiscord(channelId, { embeds: [embed] }, botToken);
            }
        }
        if (privateLogChannelId) {
            const ids = privateLogChannelId.split(',').map(id => id.trim()).filter(Boolean);
            for (const channelId of ids) {
                await postToDiscord(channelId, { embeds: [embed] }, botToken);
            }
        }

    } catch (error) {
        logger.error("Discord Deposit Logger Error:", error);
    }
}

// Helpers
async function getSettings() {
    const settings = await db.query.botSettings.findFirst();
    return {
        publicLogChannelId: settings?.publicLogChannelId,
        privateLogChannelId: settings?.privateLogChannelId,
        botToken: process.env.DISCORD_BOT_TOKEN
    };
}

async function postToDiscord(channelId: string, payload: any, token: string) {
    try {
        const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Ignore 404/403 if ID invalid
            const err = await response.text();
            if (response.status !== 404) {
                logger.error(`Discord API Error (${response.status}): ${err}`);
            }
        }
    } catch (error) {
        logger.error("Discord Request Failed:", error);
    }
}
