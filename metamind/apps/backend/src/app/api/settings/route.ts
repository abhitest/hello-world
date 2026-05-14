import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccountFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  siteId: z.string(),
  brandName: z.string().optional(),
  tone: z.enum(["professional", "friendly", "witty", "technical"]).optional(),
  targetKeywords: z.string().optional(),
  maxTitleLength: z.number().min(30).max(120).optional(),
  maxDescriptionLength: z.number().min(50).max(300).optional(),
  language: z.string().min(2).max(5).optional(),
});

/**
 * GET /api/settings?siteId=xxx
 * Retrieves brand settings for a specific site.
 */
export async function GET(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter required" },
        { status: 400 }
      );
    }

    // Verify the site belongs to this account
    const site = await prisma.site.findFirst({
      where: { webflowId: siteId, accountId: account.id },
      include: { settings: true },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Return settings or defaults
    const settings = site.settings || {
      brandName: "",
      tone: "professional",
      targetKeywords: "",
      maxTitleLength: 60,
      maxDescriptionLength: 155,
      language: "en",
    };

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/settings
 * Creates or updates brand settings for a specific site.
 */
export async function POST(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = settingsSchema.parse(body);

    // Verify the site belongs to this account
    const site = await prisma.site.findFirst({
      where: { webflowId: input.siteId, accountId: account.id },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Upsert settings
    const settings = await prisma.siteSettings.upsert({
      where: { siteId: site.id },
      update: {
        brandName: input.brandName ?? undefined,
        tone: input.tone ?? undefined,
        targetKeywords: input.targetKeywords ?? undefined,
        maxTitleLength: input.maxTitleLength ?? undefined,
        maxDescriptionLength: input.maxDescriptionLength ?? undefined,
        language: input.language ?? undefined,
      },
      create: {
        siteId: site.id,
        brandName: input.brandName || "",
        tone: input.tone || "professional",
        targetKeywords: input.targetKeywords || "",
        maxTitleLength: input.maxTitleLength || 60,
        maxDescriptionLength: input.maxDescriptionLength || 155,
        language: input.language || "en",
      },
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
