import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth";
import { createPortalSession } from "@/lib/stripe";

/**
 * POST /api/billing/portal
 * Creates a Stripe billing portal session for managing subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const returnUrl =
      body.returnUrl ||
      `${process.env.DESIGNER_EXTENSION_URL || "http://localhost:1337"}`;

    const portalUrl = await createPortalSession(account.id, returnUrl);

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
