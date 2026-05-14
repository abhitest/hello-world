import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

/**
 * Hook for communicating with the MetaMind backend API.
 * Handles auth token passing and request/response management.
 */
export function useBackend() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    // Token is stored after OAuth callback redirect
    return localStorage.getItem("metamind_token");
  };

  const request = async <T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error(
          "Not authenticated. Please reconnect your Webflow account."
        );
      }

      const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      return data as T;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Sites ─────────────────────────────────────────────────

  const getSites = async () => {
    return request<{ sites: any[] }>("/api/sites");
  };

  // ─── Usage ─────────────────────────────────────────────────

  const getUsage = async () => {
    return request<{
      period: { start: string; end: string };
      total: { generations: number; tokens: number };
      breakdown: Array<{ type: string; generations: number; tokens: number }>;
      limits: { maxGenerations: number; plan: string };
    }>("/api/usage");
  };

  // ─── Generate Meta ─────────────────────────────────────────

  const generateMeta = async (payload: {
    siteId: string;
    pageIds?: string[];
    collectionId?: string;
    template?: string;
    keyword?: string;
  }) => {
    return request<{ results: any[] }>("/api/generate/meta", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  // ─── Generate Alt Text ─────────────────────────────────────

  const generateAltText = async (payload: {
    siteId: string;
    assetIds?: string[];
  }) => {
    return request<{ results: any[] }>("/api/generate/alt-text", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  // ─── Apply Changes ─────────────────────────────────────────

  const applyChanges = async (payload: {
    siteId: string;
    changes: Array<{
      type: "page" | "cms" | "asset";
      id: string;
      collectionId?: string;
      data: any;
    }>;
  }) => {
    return request<{
      results: Array<{ id: string; type: string; success: boolean; error?: string }>;
      summary: { total: number; success: number; failed: number };
    }>("/api/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  return {
    isLoading,
    error,
    request,
    getSites,
    getUsage,
    generateMeta,
    generateAltText,
    applyChanges,
  };
}
