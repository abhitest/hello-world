import React, { useState } from "react";

interface ImageAsset {
  id: string;
  url: string;
  fileName: string;
  currentAlt: string;
  generatedAlt?: string;
  status: "idle" | "generating" | "ready" | "applied";
}

export function AltTextPanel() {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanAssets = async () => {
    setIsScanning(true);
    // TODO: Call backend to list all image assets for this site
    console.log("Scanning image assets...");
    setIsScanning(false);
  };

  const handleGenerateAll = async () => {
    // TODO: Call backend /api/generate/alt-text with image URLs
    console.log("Generating alt text for all images...");
  };

  const handleApplyAll = async () => {
    // TODO: Call backend /api/apply to write alt text back to Webflow assets
    console.log("Applying all alt text...");
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Alt Text Generator</h2>
        <p className="panel-description">
          Scan all images and generate descriptive alt text using AI vision.
        </p>
      </div>

      <div className="panel-actions">
        <button className="btn btn--primary" onClick={handleScanAssets}>
          {isScanning ? "Scanning..." : "Scan Images"}
        </button>
        <button
          className="btn btn--secondary"
          onClick={handleGenerateAll}
          disabled={assets.length === 0}
        >
          Generate All
        </button>
        <button
          className="btn btn--accent"
          onClick={handleApplyAll}
          disabled={!assets.some((a) => a.status === "ready")}
        >
          Apply All
        </button>
      </div>

      {assets.length > 0 && (
        <div className="results-list">
          {assets.map((asset) => (
            <div key={asset.id} className="result-card result-card--image">
              <img
                src={asset.url}
                alt={asset.currentAlt}
                className="result-thumbnail"
              />
              <div className="result-card-body">
                <span className="result-card-name">{asset.fileName}</span>
                {asset.currentAlt && (
                  <div className="result-field">
                    <label>Current</label>
                    <span className="result-current">{asset.currentAlt}</span>
                  </div>
                )}
                {asset.generatedAlt && (
                  <div className="result-field">
                    <label>Generated</label>
                    <span className="result-preview">{asset.generatedAlt}</span>
                  </div>
                )}
                <span className={`status-badge status--${asset.status}`}>
                  {asset.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isScanning && assets.length === 0 && (
        <div className="empty-state">
          <p>Click "Scan Images" to find all images on this site.</p>
        </div>
      )}
    </div>
  );
}
