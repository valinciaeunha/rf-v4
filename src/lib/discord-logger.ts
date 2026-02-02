import { db } from "@/lib/db";
import { botSettings, products, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

const DISCORD_API = "https://discord.com/api/v10";
const BOT_COLOR = 0x4A90D9; // Match BOT_CONFIG.color

// Helper to send message directly via REST API (bypassing Client)
export async function sendDiscordSuccessLog(data: {
    transaction: any;
    productName: string;
    stockContent: string;
    user: { username: string; discordId?: string | null };
    quantity?: number;
}) {
    try {
        const { transaction, productName, stockContent, user, quantity = 1 } = data;
        const { publicLogChannelId, privateLogChannelId, botToken } = await getSettings();

        if (!botToken) {
            logger.warn("Discord Logger: No bot token found");
            return;
        }

        // Timestamp for Discord's relative time format
        const timestamp = Math.floor(Date.now() / 1000);

        // --- Public Embed (Censored Transaction ID) ---
        let txIdDisplay = transaction.orderId;
        if (transaction.orderId && transaction.orderId.length > 8) {
            const prefix = transaction.orderId.substring(0, 6);
            txIdDisplay = `${prefix}xxxxx`;
        } else {
            txIdDisplay = 'xxxxx';
        }

        const publicEmbed = {
            title: "Pembelian Baru! 🎉",
            color: BOT_COLOR,
            fields: [
                { name: "Pembeli", value: user.discordId ? `<@${user.discordId}> (${user.username})` : `Guest (${user.username})`, inline: true },
                { name: "Produk", value: productName, inline: true },
                { name: "Jumlah", value: `${quantity} item`, inline: true },
                { name: "Harga", value: `Rp ${Number(transaction.price).toLocaleString('id-ID')}`, inline: true },
                { name: "Metode", value: transaction.paymentMethod || 'N/A', inline: true },
                { name: "Transaction ID", value: `\`${txIdDisplay}\``, inline: false },
                { name: "Tanggal", value: `<t:${timestamp}:R>`, inline: false },
            ],
            footer: { text: "Terima kasih telah berbelanja!" },
            timestamp: new Date().toISOString()
        };

        // --- Private Embed (Full Transaction ID + Stock) ---
        const privateEmbed = {
            title: "Pembelian Baru! 🎉",
            color: BOT_COLOR,
            fields: [
                { name: "Pembeli", value: user.discordId ? `<@${user.discordId}> (${user.username})` : `Guest (${user.username})`, inline: true },
                { name: "Produk", value: productName, inline: true },
                { name: "Jumlah", value: `${quantity} item`, inline: true },
                { name: "Harga", value: `Rp ${Number(transaction.price).toLocaleString('id-ID')}`, inline: true },
                { name: "Metode", value: transaction.paymentMethod || 'N/A', inline: true },
                { name: "Transaction ID", value: `\`${transaction.orderId}\``, inline: false },
                { name: "Tanggal", value: `<t:${timestamp}:R>`, inline: false },
                { name: "📄 Data Stok", value: stockContent ? `\`\`\`\n${stockContent.substring(0, 1000)}\`\`\`` : '_Tidak ada data_', inline: false },
            ],
            footer: { text: "Terima kasih telah berbelanja!" },
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

        logger.info(`Discord log sent for transaction: ${transaction.orderId}`);

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

        if (!botToken) {
            logger.warn("Discord Deposit Logger: No bot token found");
            return;
        }

        const timestamp = Math.floor(Date.now() / 1000);

        const embed = {
            title: "💰 Deposit Berhasil",
            color: 0x00AAFF, // Blue
            fields: [
                { name: "User", value: user.discordId ? `<@${user.discordId}> (${user.username})` : `Guest (${user.username})`, inline: true },
                { name: "Nominal", value: `Rp ${Number(deposit.amount).toLocaleString('id-ID')}`, inline: true },
                { name: "Reff ID", value: `\`${deposit.refId}\``, inline: false },
                { name: "Metode", value: deposit.paymentChannel || 'QRIS', inline: false },
                { name: "Tanggal", value: `<t:${timestamp}:R>`, inline: false },
            ],
            footer: { text: "Saldo berhasil ditambahkan!" },
            timestamp: new Date().toISOString()
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

        logger.info(`Discord deposit log sent: ${deposit.refId}`);

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
        logger.info(`Sending to Discord channel: ${channelId}`);

        const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.text();
            logger.error(`Discord API Error (${response.status}) for channel ${channelId}: ${err}`);
        } else {
            logger.info(`Discord message sent to channel ${channelId}`);
        }
    } catch (error) {
        logger.error("Discord Request Failed:", error);
    }
}
