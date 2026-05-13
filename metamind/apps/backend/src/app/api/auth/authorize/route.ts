import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/authorize
 * Initiates OAuth flow by redirecting to Webflow's authorization page.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.WEBFLOW_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;

  const scopes = [
    "sites:read",
    "pages:read",
    "pages:write",
    "cms:read",
    "cms:write",
    "assets:read",
    "assets:write",
  ].join(" ");

  const authUrl = new URL("https://webflow.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);

  return NextResponse.redirect(authUrl.toString());
}
