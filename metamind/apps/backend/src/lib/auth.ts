import { NextRequest } from "next/server";
import { prisma } from "./prisma";

/**
 * Extracts the account from an incoming request.
 * For MVP, we use a simple Bearer token = account ID.
 * TODO: Replace with JWT (jose) for production.
 */
export async function getAccountFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const account = await prisma.account.findUnique({
      where: { id: token },
    });

    return account;
  } catch {
    return null;
  }
}
