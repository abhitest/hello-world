import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccountFromRequest } from "@/lib/auth";
import {
  updatePageSettings,
  updateCollectionItem,
  updateAsset,
} from "@/lib/webflow";

const changeSchema = z.object({
  type: z.enum(["page", "cms", "asset"]),
  id: z.string(),
  collectionId: z.string().optional(),
  data: z.record(z.any()),
});

const requestSchema = z.object({
  siteId: z.string(),
  changes: z.array(changeSchema),
});

/**
 * POST /api/apply
 * Applies generated meta/alt text changes back to Webflow via Data API.
 */
export async function POST(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = requestSchema.parse(body);

    const results: Array<{
      id: string;
      type: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const change of input.changes) {
      try {
        switch (change.type) {
          case "page":
            await updatePageSettings(account.accessToken, change.id, {
              title: change.data.title,
              description: change.data.description,
              openGraphTitle: change.data.ogTitle,
              openGraphDescription: change.data.ogDescription,
            });
            break;

          case "cms":
            if (!change.collectionId) {
              throw new Error("collectionId required for CMS changes");
            }
            await updateCollectionItem(
              account.accessToken,
              change.collectionId,
              change.id,
              change.data
            );
            break;

          case "asset":
            await updateAsset(account.accessToken, change.id, {
              alt: change.data.alt,
            });
            break;
        }

        results.push({ id: change.id, type: change.type, success: true });
      } catch (err: any) {
        results.push({
          id: change.id,
          type: change.type,
          success: false,
          error: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error: any) {
    console.error("Apply error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
