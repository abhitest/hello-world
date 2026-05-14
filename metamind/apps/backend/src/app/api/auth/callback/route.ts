import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/callback
 * OAuth callback from Webflow. Exchanges auth code for access token,
 * stores it in the database, and redirects back to the Designer.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://api.webflow.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.WEBFLOW_CLIENT_ID,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      return NextResponse.json(
        { error: "Token exchange failed" },
        { status: 500 }
      );
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch user info
    const userRes = await fetch("https://api.webflow.com/v2/token/introspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const userData = await userRes.json();
    const webflowUserId =
      userData.authorization?.authorizedTo?.userId || "unknown";

    // Upsert account
    const account = await prisma.account.upsert({
      where: { webflowUserId },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : null,
      },
      create: {
        webflowUserId,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : null,
      },
    });

    // Create a session JWT and redirect back to designer
    // For MVP, we redirect with a simple token param
    const redirectUrl = new URL(
      process.env.DESIGNER_EXTENSION_URL || "http://localhost:1337"
    );
    redirectUrl.searchParams.set("token", account.id);
    redirectUrl.searchParams.set("status", "connected");

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Authentication failed", details: error.message },
      { status: 500 }
    );
  }
}
