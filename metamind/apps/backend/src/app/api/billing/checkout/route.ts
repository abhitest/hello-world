import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccountFromRequest } from "@/lib/auth";
import { createCheckoutSession, PLANS } from "@/lib/stripe";

const requestSchema = z.object({
  plan: z.enum(["pro", "agency"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for plan upgrade.
 */
export async function POST(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = requestSchema.parse(body);

    const plan = PLANS[input.plan];
    if (!plan?.stripePriceId) {
      return NextResponse.json(
        { error: "Invalid plan or price not configured" },
        { status: 400 }
      );
    }

    const defaultSuccessUrl = `${process.env.DESIGNER_EXTENSION_URL || "http://localhost:1337"}?billing=success`;
    const defaultCancelUrl = `${process.env.DESIGNER_EXTENSION_URL || "http://localhost:1337"}?billing=cancelled`;

    const checkoutUrl = await createCheckoutSession(
      account.id,
      plan.stripePriceId,
      input.successUrl || defaultSuccessUrl,
      input.cancelUrl || defaultCancelUrl
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
