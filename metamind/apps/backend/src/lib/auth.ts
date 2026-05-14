import { NextRequest } from "next/server";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "./prisma";

// ─── JWT Configuration ───────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "metamind-dev-secret-change-in-production"
);
const JWT_ISSUER = "metamind";
const JWT_AUDIENCE = "metamind-api";
const JWT_EXPIRATION = "7d"; // Tokens valid for 7 days

interface TokenPayload extends JWTPayload {
  accountId: string;
  webflowUserId: string;
}

// ─── Token Creation ──────────────────────────────────────────

/**
 * Creates a signed JWT token for an authenticated account.
 */
export async function createToken(account: {
  id: string;
  webflowUserId: string;
}): Promise<string> {
  const token = await new SignJWT({
    accountId: account.id,
    webflowUserId: account.webflowUserId,
  } as TokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);

  return token;
}

// ─── Token Verification ──────────────────────────────────────

/**
 * Verifies a JWT token and returns the payload.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as TokenPayload;
  } catch (err) {
    return null;
  }
}

// ─── Request Authentication ──────────────────────────────────

/**
 * Extracts and verifies the account from an incoming request.
 * Supports JWT tokens (production) and falls back to account ID lookup (dev/migration).
 */
export async function getAccountFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) return null;

  // First try JWT verification
  const payload = await verifyToken(token);

  if (payload?.accountId) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: payload.accountId },
      });
      return account;
    } catch {
      return null;
    }
  }

  // Fallback: treat token as raw account ID (backward compatible for dev)
  // This allows existing tokens to still work during migration
  try {
    const account = await prisma.account.findUnique({
      where: { id: token },
    });
    return account;
  } catch {
    return null;
  }
}
