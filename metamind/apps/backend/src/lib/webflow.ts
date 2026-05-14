/**
 * Webflow API v2 client wrapper.
 * Handles token-based requests to the Webflow Data API.
 */

const WEBFLOW_API_BASE = "https://api.webflow.com/v2";

interface WebflowRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: any;
  token: string;
}

export async function webflowApi<T = any>(
  path: string,
  options: WebflowRequestOptions
): Promise<T> {
  const { method = "GET", body, token } = options;

  const res = await fetch(`${WEBFLOW_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      `Webflow API error [${res.status}]: ${error.message || error.msg || JSON.stringify(error)}`
    );
  }

  return res.json();
}

// ─── Site APIs ───────────────────────────────────────────────

export async function listSites(token: string) {
  return webflowApi<{ sites: any[] }>("/sites", { token });
}

export async function getSite(token: string, siteId: string) {
  return webflowApi(`/sites/${siteId}`, { token });
}

// ─── Page APIs ───────────────────────────────────────────────

export async function listPages(token: string, siteId: string) {
  return webflowApi<{ pages: any[] }>(`/sites/${siteId}/pages`, { token });
}

export async function updatePageSettings(
  token: string,
  pageId: string,
  data: {
    title?: string;
    description?: string;
    openGraphTitle?: string;
    openGraphDescription?: string;
  }
) {
  return webflowApi(`/pages/${pageId}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

// ─── CMS APIs ────────────────────────────────────────────────

export async function listCollections(token: string, siteId: string) {
  return webflowApi<{ collections: any[] }>(`/sites/${siteId}/collections`, {
    token,
  });
}

export async function listCollectionItems(
  token: string,
  collectionId: string,
  offset = 0,
  limit = 100
) {
  return webflowApi(
    `/collections/${collectionId}/items?offset=${offset}&limit=${limit}`,
    { token }
  );
}

export async function updateCollectionItem(
  token: string,
  collectionId: string,
  itemId: string,
  fieldData: Record<string, any>
) {
  return webflowApi(`/collections/${collectionId}/items/${itemId}`, {
    method: "PATCH",
    token,
    body: { fieldData },
  });
}

export async function bulkUpdateCollectionItems(
  token: string,
  collectionId: string,
  items: Array<{ id: string; fieldData: Record<string, any> }>
) {
  return webflowApi(`/collections/${collectionId}/items`, {
    method: "PATCH",
    token,
    body: { items },
  });
}

// ─── Asset APIs ──────────────────────────────────────────────

export async function listAssets(token: string, siteId: string) {
  return webflowApi<{ assets: any[] }>(`/sites/${siteId}/assets`, { token });
}

export async function updateAsset(
  token: string,
  assetId: string,
  data: { alt?: string }
) {
  return webflowApi(`/assets/${assetId}`, {
    method: "PATCH",
    token,
    body: data,
  });
}
