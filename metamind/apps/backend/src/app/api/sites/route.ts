import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listSites } from "@/lib/webflow";
import { getAccountFromRequest } from "@/lib/auth";

/**
 * GET /api/sites
 * Lists all Webflow sites the user has authorized access to.
 */
export async function GET(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sites } = await listSites(account.accessToken);

    // Sync sites to local DB
    for (const site of sites) {
      await prisma.site.upsert({
        where: { webflowId: site.id },
        update: { name: site.displayName || site.shortName },
        create: {
          webflowId: site.id,
          name: site.displayName || site.shortName,
          accountId: account.id,
        },
      });
    }

    return NextResponse.json({ sites });
  } catch (error: any) {
    console.error("Sites error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
