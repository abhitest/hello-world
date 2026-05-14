import React, { useState } from "react";
import { useBackend } from "../hooks/useBackend";

interface ImageAsset {
  id: string;
  url: string;
  fileName: string;
  currentAlt: string;
  generatedAlt?: string;
  status: "idle" | "generating" | "ready" | "applied" | "error";
  error?: string;
}

export function AltTextPanel() {
  const { generateAltText, applyChanges, request, isLoading, error } =
    useBackend();

  const [siteId, setSiteId] = useState<string | null>(null);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanAssets = async () => {
    setIsScanning(true);
    try {
      // Get the site ID
      const sitesRes = await request<{ sites: any[] }>("/api/sites");
      if (!sitesRes || !sitesRes.sites?.length) {
        setIsScanning(false);
        return;
      }

      const site = sitesRes.sites[0];
      setSiteId(site.id);

      // Fetch assets — we'll use the generate endpoint with no assetIds
      // to get a full scan, or directly list assets
      const assetsRes = await request<{ assets: any[] }>(
        `/api/sites/${site.id}/assets`
      );

      if (assetsRes?.assets) {
        const imageAssets = assetsRes.assets
          .filter((a: any) => a.contentType?.startsWith("image/"))
          .map((a: any) => ({
            id: a.id,
            url: a.hostedUrl || a.url,
            fileName: a.fileName || a.id,
            currentAlt: a.alt || "",
            status: "idle" as const,
          }));
        setAssets(imageAssets);
      }
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!siteId || assets.length === 0) return;

    // Mark all as generating
    setAssets((prev) =>
      prev.map((a) => ({ ...a, status: "generating" as const }))
    );

    const assetIds = assets.map((a) => a.id);
    const res = await generateAltText({ siteId, assetIds });

    if (res?.results) {
      setAssets((prev) =>
        prev.map((asset) => {
          const result = res.results.find((r: any) => r.id === asset.id);
          if (result) {
            return {
              ...asset,
              generatedAlt: result.generatedAlt,
              status: "ready" as const,
            };
          }
          return {
            ...asset,
            status: "error" as const,
            error: "No result returned",
          };
        })
      );
    } else {
      setAssets((prev) =>
        prev.map((a) => ({
          ...a,
          status: "error" as const,
          error: error || "Generation failed",
        }))
      );
    }
  };

  const handleApplyOne = async (assetId: string) => {
    if (!siteId) return;

    const asset = assets.find((a) => a.id === assetId);
    if (!asset || !asset.generatedAlt) return;

    const res = await applyChanges({
      siteId,
      changes: [
        {
          type: "asset",
          id: assetId,
          data: { alt: asset.generatedAlt },
        },
      ],
    });

    if (res?.results?.[0]?.success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId ? { ...a, status: "applied" as const } : a
        )
      );
    }
  };

  const handleApplyAll = async () => {
    if (!siteId) return;

    const readyAssets = assets.filter((a) => a.status === "ready");
    if (readyAssets.length === 0) return;

    const changes = readyAssets.map((asset) => ({
      type: "asset" as const,
      id: asset.id,
      data: { alt: asset.generatedAlt },
    }));

    const res = await applyChanges({ siteId, changes });

    if (res?.results) {
      setAssets((prev) =>
        prev.map((asset) => {
          const result = res.results.find((r: any) => r.id === asset.id);
          if (result?.success) {
            return { ...asset, status: "applied" as const };
          }
          return asset;
        })
      );
    }
  };

  const readyCount = assets.filter((a) => a.status === "ready").length;
  const appliedCount = assets.filter((a) => a.status === "applied").length;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Alt Text Generator</h2>
        <p className="panel-description">
          Scan all images and generate descriptive alt text using AI vision.
        </p>
      </div>

      <div className="panel-actions">
        <button
          className="btn btn--primary"
          onClick={handleScanAssets}
          disabled={isScanning || isLoading}
        >
          {isScanning ? "Scanning..." : "Scan Images"}
        </button>
        <button
          className="btn btn--secondary"
          onClick={handleGenerateAll}
          disabled={assets.length === 0 || isLoading}
        >
          {isLoading ? "Generating..." : `Generate All (${assets.length})`}
        </button>
        <button
          className="btn btn--accent"
          onClick={handleApplyAll}
          disabled={readyCount === 0}
        >
          Apply All ({readyCount})
        </button>
      </div>

      {error && (
        <div className="hint" style={{ color: "var(--error)" }}>
          {error}
        </div>
      )}

      {assets.length > 0 && (
        <>
          <div className="hint" style={{ marginBottom: "12px" }}>
            {assets.length} images found &middot; {readyCount} ready &middot;{" "}
            {appliedCount} applied
          </div>
          <div className="results-list">
            {assets.map((asset) => (
              <div key={asset.id} className="result-card result-card--image">
                <img
                  src={asset.url}
                  alt={asset.currentAlt}
                  className="result-thumbnail"
                />
                <div className="result-card-body">
                  <div className="result-card-header">
                    <span className="result-card-name">{asset.fileName}</span>
                    <span className={`status-badge status--${asset.status}`}>
                      {asset.status}
                    </span>
                  </div>
                  {asset.currentAlt && (
                    <div className="result-field">
                      <label>Current</label>
                      <span className="result-current">{asset.currentAlt}</span>
                    </div>
                  )}
                  {asset.generatedAlt && (
                    <div className="result-field">
                      <label>Generated</label>
                      <span className="result-preview">
                        {asset.generatedAlt}
                        <span className="hint">
                          {" "}
                          ({asset.generatedAlt.length} chars)
                        </span>
                      </span>
                    </div>
                  )}
                  {asset.error && (
                    <div className="hint" style={{ color: "var(--error)" }}>
                      {asset.error}
                    </div>
                  )}
                  {asset.status === "ready" && (
                    <button
                      className="btn btn--small btn--primary"
                      onClick={() => handleApplyOne(asset.id)}
                      style={{ marginTop: "6px" }}
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isScanning && assets.length === 0 && (
        <div className="empty-state">
          <p>Click "Scan Images" to find all images on this site.</p>
        </div>
      )}
    </div>
  );
}
