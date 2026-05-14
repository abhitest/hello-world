/**
 * Types related to AI generation inputs and outputs.
 */

export type Tone = "professional" | "friendly" | "witty" | "technical";

export interface MetaGenerationInput {
  content: string;
  pageType: string;
  keyword?: string;
  brandName?: string;
  tone?: Tone;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  language?: string;
  template?: string;
}

export interface MetaGenerationOutput {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export interface AltTextGenerationInput {
  imageUrl: string;
  pageContext?: string;
  maxLength?: number;
}

// ─── Generation Status ───────────────────────────────────────

export type GenerationStatus = "idle" | "generating" | "ready" | "applied" | "error";

export interface PageMetaItem {
  id: string;
  name: string;
  slug: string;
  currentTitle: string;
  currentDescription: string;
  generatedTitle?: string;
  generatedDescription?: string;
  generatedOgTitle?: string;
  generatedOgDescription?: string;
  status: GenerationStatus;
  error?: string;
}

export interface ImageAssetItem {
  id: string;
  url: string;
  fileName: string;
  currentAlt: string;
  generatedAlt?: string;
  status: GenerationStatus;
  error?: string;
}
