import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    // SECURITY: Verify state parameter to prevent CSRF
    const storedState = request.cookies.get("discord_oauth_state")?.value;

    if (!state || !storedState || state !== storedState) {
        console.error("Discord OAuth: Invalid or missing state parameter");
        return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
    }

    if (error || !code) {
        return NextResponse.redirect(new URL("/login?error=discord_auth_failed", request.url));
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!clientId || !clientSecret || !appUrl) {
        console.error("Missing Discord configuration");
        return NextResponse.redirect(new URL("/login?error=config_missing", request.url));
    }

    const redirectUri = `${appUrl}/api/auth/discord/callback`;

    try {
        // 1. Exchange code for token
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            console.error("Discord token error:", err);
            return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url));
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Get User Info
        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userResponse.ok) {
            return NextResponse.redirect(new URL("/login?error=user_fetch_failed", request.url));
        }

        interface DiscordUser {
            id: string;
            username: string;
            discriminator: string;
            global_name?: string;
            avatar?: string;
            email?: string;
            verified?: boolean;
        }

        const discordUser = await userResponse.json() as DiscordUser;

        // 3. Find or Create User
        // Check by Discord ID
        let dbUser = await db.query.users.findFirst({
            where: eq(users.discordId, discordUser.id)
        });

        // Use email from Discord if available and verified
        // Note: Discord doesn't always guarantee email, but usually does with 'email' scope
        const email = discordUser.email;
        const username = discordUser.username;

        if (!dbUser && email) {
            // Check by email if not found by Discord ID
            // This links existing email accounts to Discord
            dbUser = await db.query.users.findFirst({
                where: eq(users.email, email)
            });

            if (dbUser) {
                // Link Discord ID to existing user
                await db.update(users)
                    .set({ discordId: discordUser.id })
                    .where(eq(users.id, dbUser.id));

                // Refresh local object
                dbUser = { ...dbUser, discordId: discordUser.id };
            }
        }

        if (!dbUser) {
            // Register new user
            // Placeholders for non-nullable fields
            const placeholderEmail = email || `discord_${discordUser.id}@discord.com`;

            const [newUser] = await db.insert(users).values({
                username: username,
                email: placeholderEmail,
                discordId: discordUser.id,
                role: 'user', // Default role
                balance: '0.00',
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            dbUser = newUser;
        }

        // 4. Create Session
        await createSession({
            userId: dbUser.id,
            email: dbUser.email,
            username: dbUser.username,
            role: dbUser.role,
        });

        return NextResponse.redirect(new URL("/dashboard", request.url));

    } catch (err) {
        console.error("Discord auth error:", err);
        return NextResponse.redirect(new URL("/login?error=server_error", request.url));
    }
}
