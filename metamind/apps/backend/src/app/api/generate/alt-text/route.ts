import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccountFromRequest } from "@/lib/auth";
import { listAssets } from "@/lib/webflow";
import { generateAltText } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  siteId: z.string(),
  assetIds: z.array(z.string()).optional(),
});

/**
 * POST /api/generate/alt-text
 * Generates alt text for site images using GPT-4o vision.
 */
export async function POST(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = requestSchema.parse(body);

    // List all assets
    const { assets } = await listAssets(account.accessToken, input.siteId);

    // Filter to images only
    const imageAssets = assets.filter(
      (a: any) =>
        a.contentType?.startsWith("image/") &&
        (!input.assetIds || input.assetIds.includes(a.id))
    );

    const results: Array<{
      id: string;
      fileName: string;
      url: string;
      currentAlt: string;
      generatedAlt: string;
    }> = [];

    for (const asset of imageAssets) {
      try {
        const altText = await generateAltText({
          imageUrl: asset.hostedUrl || asset.url,
          pageContext: "", // Could be enhanced by checking where the image is used
          maxLength: 125,
        });

        results.push({
          id: asset.id,
          fileName: asset.fileName || asset.id,
          url: asset.hostedUrl || asset.url,
          currentAlt: asset.alt || "",
          generatedAlt: altText,
        });
      } catch (err: any) {
        console.error(`Alt text generation failed for ${asset.id}:`, err);
        results.push({
          id: asset.id,
          fileName: asset.fileName || asset.id,
          url: asset.hostedUrl || asset.url,
          currentAlt: asset.alt || "",
          generatedAlt: `[Error: ${err.message}]`,
        });
      }
    }

    // Track usage
    await prisma.usageRecord.create({
      data: {
        accountId: account.id,
        type: "alt_text_generation",
        count: results.length,
        tokens: results.length * 200,
      },
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Generate alt-text error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
