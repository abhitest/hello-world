import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "./auth";
import { checkRateLimit, GENERATION_LIMIT, GENERAL_LIMIT } from "./rate-limit";
import { checkUsageLimit } from "./stripe";

/**
 * Shared API guard that combines authentication, rate limiting, and usage enforcement.
 * Use this at the top of generation API routes for consistent protection.
 */

export interface GuardedAccount {
  id: string;
  webflowUserId: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  email: string | null;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type GuardResult =
  | { success: true; account: GuardedAccount }
  | { success: false; response: NextResponse };

/**
 * Protects a generation endpoint with auth + rate limit + usage quota.
 */
export async function guardGenerationRoute(
  request: NextRequest
): Promise<GuardResult> {
  // 1. Authentication
  const account = await getAccountFromRequest(request);
  if (!account) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
    };
  }

  // 2. Rate limiting (per account)
  const rateLimitResult = checkRateLimit(
    `gen:${account.id}`,
    GENERATION_LIMIT
  );

  if (!rateLimitResult.allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Too many requests. Please slow down.",
          code: "RATE_LIMITED",
          retryAfterMs: rateLimitResult.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.retryAfterMs || 1000) / 1000)
            ),
            "X-RateLimit-Remaining": "0",
          },
        }
      ),
    };
  }

  // 3. Usage quota enforcement
  const usageResult = await checkUsageLimit(account.id);

  if (!usageResult.allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: `Monthly generation limit reached (${usageResult.current}/${usageResult.limit}). Upgrade your plan for more.`,
          code: "USAGE_LIMIT_EXCEEDED",
          current: usageResult.current,
          limit: usageResult.limit,
          plan: usageResult.plan,
        },
        { status: 403 }
      ),
    };
  }

  return { success: true, account: account as GuardedAccount };
}

/**
 * Protects a general API endpoint with auth + rate limit (no usage quota check).
 */
export async function guardRoute(
  request: NextRequest
): Promise<GuardResult> {
  // 1. Authentication
  const account = await getAccountFromRequest(request);
  if (!account) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
    };
  }

  // 2. Rate limiting (per account, general limit)
  const rateLimitResult = checkRateLimit(`api:${account.id}`, GENERAL_LIMIT);

  if (!rateLimitResult.allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Too many requests. Please slow down.",
          code: "RATE_LIMITED",
          retryAfterMs: rateLimitResult.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.retryAfterMs || 1000) / 1000)
            ),
          },
        }
      ),
    };
  }

  return { success: true, account: account as GuardedAccount };
}

// ─── Error Response Helpers ──────────────────────────────────

export function errorResponse(
  message: string,
  status: number,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

export function validationError(zodError: any): NextResponse {
  const issues = zodError.errors?.map((e: any) => ({
    field: e.path.join("."),
    message: e.message,
  }));

  return NextResponse.json(
    {
      error: "Invalid request body",
      code: "VALIDATION_ERROR",
      details: issues,
    },
    { status: 400 }
  );
}
