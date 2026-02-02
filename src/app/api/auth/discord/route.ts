import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!clientId || !appUrl) {
        return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
    }

    const redirectUri = `${appUrl}/api/auth/discord/callback`;
    const scope = "identify email";

    // SECURITY: Generate random state to prevent CSRF attacks
    const state = randomBytes(32).toString('hex');

    // Construct the OAuth URL
    const url = new URL("https://discord.com/api/oauth2/authorize");
    url.searchParams.append("client_id", clientId);
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", scope);
    url.searchParams.append("state", state);

    // Create response with redirect
    const response = NextResponse.redirect(url.toString());

    // Store state in httpOnly cookie for verification in callback
    response.cookies.set("discord_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
    });

    return response;
}
