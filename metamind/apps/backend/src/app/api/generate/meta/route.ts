import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardGenerationRoute, validationError } from "@/lib/api-guard";
import { listPages, listCollectionItems } from "@/lib/webflow";
import { generateMeta } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  siteId: z.string().min(1, "siteId is required"),
  pageIds: z.array(z.string()).optional(),
  collectionId: z.string().optional(),
  template: z.string().optional(),
  keyword: z.string().optional(),
});

/**
 * POST /api/generate/meta
 * Generates meta tags for pages or CMS items using AI.
 * Protected by: auth + rate limit + usage quota.
 */
export async function POST(request: NextRequest) {
  // Guard: auth + rate limit + usage quota
  const guard = await guardGenerationRoute(request);
  if (!guard.success) return guard.response;

  const { account } = guard;

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const input = parsed.data;

    // Load site settings for brand voice
    const site = await prisma.site.findUnique({
      where: { webflowId: input.siteId },
      include: { settings: true },
    });

    const settings = site?.settings;
    const results: Array<{
      id: string;
      type: "page" | "cms";
      name: string;
      generated: {
        title: string;
        description: string;
        ogTitle: string;
        ogDescription: string;
      };
    }> = [];

    if (input.pageIds && input.pageIds.length > 0) {
      // Generate for specific pages
      const { pages } = await listPages(account.accessToken, input.siteId);
      const targetPages = pages.filter((p: any) =>
        input.pageIds!.includes(p.id)
      );

      for (const page of targetPages) {
        const generated = await generateMeta({
          content: page.title || page.slug || "",
          pageType: "web page",
          keyword: input.keyword,
          brandName: settings?.brandName,
          tone: settings?.tone,
          maxTitleLength: settings?.maxTitleLength,
          maxDescriptionLength: settings?.maxDescriptionLength,
          language: settings?.language,
        });

        results.push({
          id: page.id,
          type: "page",
          name: page.title || page.slug,
          generated,
        });
      }
    }

    if (input.collectionId) {
      // Generate for CMS items
      const { items } = await listCollectionItems(
        account.accessToken,
        input.collectionId
      );

      for (const item of items || []) {
        const content = Object.values(item.fieldData || {})
          .filter((v) => typeof v === "string")
          .join(" ");

        const generated = await generateMeta({
          content: content.slice(0, 2000),
          pageType: "CMS item",
          keyword: input.keyword,
          brandName: settings?.brandName,
          tone: settings?.tone,
          maxTitleLength: settings?.maxTitleLength,
          maxDescriptionLength: settings?.maxDescriptionLength,
          language: settings?.language,
        });

        results.push({
          id: item.id,
          type: "cms",
          name: item.fieldData?.name || item.fieldData?.title || item.id,
          generated,
        });
      }
    }

    // Track usage
    await prisma.usageRecord.create({
      data: {
        accountId: account.id,
        type: "meta_generation",
        count: results.length,
        tokens: results.length * 350,
      },
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Generate meta error:", error);
    return NextResponse.json(
      { error: error.message, code: "GENERATION_FAILED" },
      { status: 500 }
    );
  }
}
