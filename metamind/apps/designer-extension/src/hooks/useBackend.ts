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
        throw new Error("Not authenticated. Please reconnect your Webflow account.");
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
        throw new Error(body.message || `Request failed: ${res.status}`);
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

  const generateMeta = async (payload: {
    siteId: string;
    pageIds?: string[];
    collectionId?: string;
    template?: string;
  }) => {
    return request("/api/generate/meta", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const generateAltText = async (payload: {
    siteId: string;
    assetIds: string[];
  }) => {
    return request("/api/generate/alt-text", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const applyChanges = async (payload: {
    siteId: string;
    changes: Array<{ type: "page" | "cms" | "asset"; id: string; data: any }>;
  }) => {
    return request("/api/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  return {
    isLoading,
    error,
    generateMeta,
    generateAltText,
    applyChanges,
    request,
  };
}
