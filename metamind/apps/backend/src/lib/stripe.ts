import Stripe from "stripe";
import { prisma } from "./prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

// ─── Plan Configuration ──────────────────────────────────────

export interface PlanConfig {
  name: string;
  maxGenerationsPerMonth: number;
  maxSites: number;
  stripePriceId: string | null;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: "Free",
    maxGenerationsPerMonth: 50,
    maxSites: 1,
    stripePriceId: null,
  },
  pro: {
    name: "Pro",
    maxGenerationsPerMonth: 2000,
    maxSites: 3,
    stripePriceId: process.env.STRIPE_PRICE_PRO || null,
  },
  agency: {
    name: "Agency",
    maxGenerationsPerMonth: 10000,
    maxSites: 999,
    stripePriceId: process.env.STRIPE_PRICE_AGENCY || null,
  },
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Get the current plan for an account based on their Stripe subscription status.
 */
export async function getAccountPlan(accountId: string): Promise<PlanConfig> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) return PLANS.free;

  // Check for active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      accountId,
      status: { in: ["active", "trialing"] },
    },
  });

  if (!subscription) return PLANS.free;

  // Match price ID to plan
  for (const [, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === subscription.stripePriceId) {
      return plan;
    }
  }

  return PLANS.free;
}

/**
 * Check if an account has exceeded their generation limit for the current month.
 */
export async function checkUsageLimit(accountId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
}> {
  const plan = await getAccountPlan(accountId);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.usageRecord.aggregate({
    where: {
      accountId,
      createdAt: { gte: startOfMonth },
    },
    _sum: { count: true },
  });

  const current = usage._sum.count || 0;

  return {
    allowed: current < plan.maxGenerationsPerMonth,
    current,
    limit: plan.maxGenerationsPerMonth,
    plan: plan.name,
  };
}

/**
 * Create a Stripe Checkout session for a plan upgrade.
 */
export async function createCheckoutSession(
  accountId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) throw new Error("Account not found");

  // Get or create Stripe customer
  let stripeCustomerId = account.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      metadata: { accountId: account.id, webflowUserId: account.webflowUserId },
    });
    stripeCustomerId = customer.id;

    await prisma.account.update({
      where: { id: accountId },
      data: { stripeCustomerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { accountId },
  });

  return session.url!;
}

/**
 * Create a Stripe billing portal session for subscription management.
 */
export async function createPortalSession(
  accountId: string,
  returnUrl: string
): Promise<string> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}
