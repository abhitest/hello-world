/**
 * Shared API request/response types used by both
 * the Designer Extension (frontend) and the Backend.
 */

// ─── Generic API Response ────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Generate Meta Request/Response ──────────────────────────

export interface GenerateMetaRequest {
  siteId: string;
  pageIds?: string[];
  collectionId?: string;
  template?: string;
  keyword?: string;
}

export interface GeneratedMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export interface MetaResult {
  id: string;
  type: "page" | "cms";
  name: string;
  generated: GeneratedMeta;
}

export interface GenerateMetaResponse {
  results: MetaResult[];
}

// ─── Generate Alt Text Request/Response ──────────────────────

export interface GenerateAltTextRequest {
  siteId: string;
  assetIds?: string[];
}

export interface AltTextResult {
  id: string;
  fileName: string;
  url: string;
  currentAlt: string;
  generatedAlt: string;
}

export interface GenerateAltTextResponse {
  results: AltTextResult[];
}

// ─── Apply Changes Request/Response ──────────────────────────

export interface ApplyChange {
  type: "page" | "cms" | "asset";
  id: string;
  collectionId?: string;
  data: Record<string, any>;
}

export interface ApplyRequest {
  siteId: string;
  changes: ApplyChange[];
}

export interface ApplyResult {
  id: string;
  type: string;
  success: boolean;
  error?: string;
}

export interface ApplyResponse {
  results: ApplyResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

// ─── Usage ───────────────────────────────────────────────────

export interface UsageResponse {
  period: {
    start: string;
    end: string;
  };
  total: {
    generations: number;
    tokens: number;
  };
  breakdown: Array<{
    type: string;
    generations: number;
    tokens: number;
  }>;
  limits: {
    maxGenerations: number;
    plan: string;
  };
}
