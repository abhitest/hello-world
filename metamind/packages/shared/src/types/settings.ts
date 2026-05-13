/**
 * Types for brand settings and app configuration.
 */

import type { Tone } from "./generation";

export interface BrandSettings {
  brandName: string;
  tone: Tone;
  targetKeywords: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
  language: string;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: "",
  tone: "professional",
  targetKeywords: "",
  maxTitleLength: 60,
  maxDescriptionLength: 155,
  language: "en",
};

// ─── Supported Languages ─────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// ─── Plan Limits ─────────────────────────────────────────────

export interface PlanLimits {
  maxGenerationsPerMonth: number;
  maxSites: number;
  name: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    name: "Free",
    maxGenerationsPerMonth: 50,
    maxSites: 1,
  },
  pro: {
    name: "Pro",
    maxGenerationsPerMonth: 2000,
    maxSites: 3,
  },
  agency: {
    name: "Agency",
    maxGenerationsPerMonth: 10000,
    maxSites: 999,
  },
};
