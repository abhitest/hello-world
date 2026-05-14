import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "@/lib/stripe";

/**
 * GET /api/usage
 * Returns usage statistics for the current billing period.
 */
export async function GET(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usageRecord.aggregate({
      where: {
        accountId: account.id,
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        count: true,
        tokens: true,
      },
    });

    const byType = await prisma.usageRecord.groupBy({
      by: ["type"],
      where: {
        accountId: account.id,
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        count: true,
        tokens: true,
      },
    });

    // Get plan-based limits
    const usageLimits = await checkUsageLimit(account.id);

    return NextResponse.json({
      period: {
        start: startOfMonth.toISOString(),
        end: new Date().toISOString(),
      },
      total: {
        generations: usage._sum.count || 0,
        tokens: usage._sum.tokens || 0,
      },
      breakdown: byType.map((t) => ({
        type: t.type,
        generations: t._sum.count || 0,
        tokens: t._sum.tokens || 0,
      })),
      limits: {
        maxGenerations: usageLimits.limit,
        plan: usageLimits.plan.toLowerCase(),
      },
    });
  } catch (error: any) {
    console.error("Usage error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
