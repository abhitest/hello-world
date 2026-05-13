import React, { useState } from "react";
import { useWebflow } from "../hooks/useWebflow";

interface PageMeta {
  id: string;
  name: string;
  title: string;
  description: string;
  generatedTitle?: string;
  generatedDescription?: string;
  status: "idle" | "generating" | "ready" | "applied";
}

export function PageSeoPanel() {
  const { pages, isLoading } = useWebflow();
  const [pageMetas, setPageMetas] = useState<PageMeta[]>([]);

  const handleScan = async () => {
    // TODO: Fetch pages from backend, populate pageMetas
    console.log("Scanning pages...", pages);
  };

  const handleGenerateAll = async () => {
    // TODO: Call backend /api/generate/meta with page data
    console.log("Generating meta for all pages...");
  };

  const handleApply = async (pageId: string) => {
    // TODO: Call backend /api/apply to write meta back to Webflow
    console.log("Applying meta for page:", pageId);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Page SEO</h2>
        <p className="panel-description">
          Generate optimized meta titles and descriptions for all static pages.
        </p>
      </div>

      <div className="panel-actions">
        <button className="btn btn--primary" onClick={handleScan}>
          Scan Pages
        </button>
        <button
          className="btn btn--secondary"
          onClick={handleGenerateAll}
          disabled={pageMetas.length === 0}
        >
          Generate All
        </button>
      </div>

      {isLoading && <div className="loading">Scanning pages...</div>}

      {pageMetas.length > 0 && (
        <div className="results-list">
          {pageMetas.map((page) => (
            <div key={page.id} className="result-card">
              <div className="result-card-header">
                <span className="result-card-name">{page.name}</span>
                <span className={`status-badge status--${page.status}`}>
                  {page.status}
                </span>
              </div>
              {page.generatedTitle && (
                <div className="result-field">
                  <label>Title</label>
                  <div className="result-preview">{page.generatedTitle}</div>
                </div>
              )}
              {page.generatedDescription && (
                <div className="result-field">
                  <label>Description</label>
                  <div className="result-preview">
                    {page.generatedDescription}
                  </div>
                </div>
              )}
              {page.status === "ready" && (
                <button
                  className="btn btn--small"
                  onClick={() => handleApply(page.id)}
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && pageMetas.length === 0 && (
        <div className="empty-state">
          <p>Click "Scan Pages" to discover pages on this site.</p>
        </div>
      )}
    </div>
  );
}
