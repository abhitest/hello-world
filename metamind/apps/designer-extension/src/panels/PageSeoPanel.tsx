import React, { useState } from "react";
import { useWebflow } from "../hooks/useWebflow";
import { useBackend } from "../hooks/useBackend";

interface PageMeta {
  id: string;
  name: string;
  slug: string;
  currentTitle: string;
  currentDescription: string;
  generatedTitle?: string;
  generatedDescription?: string;
  generatedOgTitle?: string;
  generatedOgDescription?: string;
  status: "idle" | "generating" | "ready" | "applied" | "error";
  error?: string;
}

export function PageSeoPanel() {
  const { pages } = useWebflow();
  const { generateMeta, applyChanges, request, isLoading, error } =
    useBackend();

  const [siteId, setSiteId] = useState<string | null>(null);
  const [pageMetas, setPageMetas] = useState<PageMeta[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      // First get the sites to find the siteId
      const sitesRes = await request<{ sites: any[] }>("/api/sites");
      if (!sitesRes || !sitesRes.sites?.length) {
        setIsScanning(false);
        return;
      }

      const site = sitesRes.sites[0]; // Use first authorized site
      setSiteId(site.id);

      // Fetch pages via Webflow SDK or use the pages from the hook
      // Map pages into our local state
      const mappedPages: PageMeta[] = (pages.length > 0 ? pages : sitesRes.sites[0]?.pages || []).map(
        (p: any) => ({
          id: p.id,
          name: p.title || p.slug || "Untitled",
          slug: p.slug || "",
          currentTitle: p.seo?.title || p.title || "",
          currentDescription: p.seo?.description || "",
          status: "idle" as const,
        })
      );

      // If we didn't get pages from the Webflow SDK, fetch them from backend
      if (mappedPages.length === 0) {
        const pagesRes = await request<{ pages: any[] }>(
          `/api/sites/${site.id}/pages`
        );
        if (pagesRes?.pages) {
          const backendPages: PageMeta[] = pagesRes.pages.map((p: any) => ({
            id: p.id,
            name: p.title || p.slug || "Untitled",
            slug: p.slug || "",
            currentTitle: p.seo?.title || p.title || "",
            currentDescription: p.seo?.description || "",
            status: "idle" as const,
          }));
          setPageMetas(backendPages);
        }
      } else {
        setPageMetas(mappedPages);
      }
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!siteId || pageMetas.length === 0) return;

    // Mark all as generating
    setPageMetas((prev) =>
      prev.map((p) => ({ ...p, status: "generating" as const }))
    );

    const pageIds = pageMetas.map((p) => p.id);
    const res = await generateMeta({ siteId, pageIds });

    if (res?.results) {
      setPageMetas((prev) =>
        prev.map((page) => {
          const result = res.results.find((r: any) => r.id === page.id);
          if (result) {
            return {
              ...page,
              generatedTitle: result.generated.title,
              generatedDescription: result.generated.description,
              generatedOgTitle: result.generated.ogTitle,
              generatedOgDescription: result.generated.ogDescription,
              status: "ready" as const,
            };
          }
          return { ...page, status: "error" as const, error: "No result returned" };
        })
      );
    } else {
      setPageMetas((prev) =>
        prev.map((p) => ({ ...p, status: "error" as const, error: error || "Generation failed" }))
      );
    }
  };

  const handleApply = async (pageId: string) => {
    if (!siteId) return;

    const page = pageMetas.find((p) => p.id === pageId);
    if (!page || !page.generatedTitle) return;

    const res = await applyChanges({
      siteId,
      changes: [
        {
          type: "page",
          id: pageId,
          data: {
            title: page.generatedTitle,
            description: page.generatedDescription,
            ogTitle: page.generatedOgTitle,
            ogDescription: page.generatedOgDescription,
          },
        },
      ],
    });

    if (res?.results?.[0]?.success) {
      setPageMetas((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, status: "applied" as const } : p
        )
      );
    }
  };

  const handleApplyAll = async () => {
    if (!siteId) return;

    const readyPages = pageMetas.filter((p) => p.status === "ready");
    if (readyPages.length === 0) return;

    const changes = readyPages.map((page) => ({
      type: "page" as const,
      id: page.id,
      data: {
        title: page.generatedTitle,
        description: page.generatedDescription,
        ogTitle: page.generatedOgTitle,
        ogDescription: page.generatedOgDescription,
      },
    }));

    const res = await applyChanges({ siteId, changes });

    if (res?.results) {
      setPageMetas((prev) =>
        prev.map((p) => {
          const result = res.results.find((r: any) => r.id === p.id);
          if (result?.success) {
            return { ...p, status: "applied" as const };
          }
          return p;
        })
      );
    }
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
        <button
          className="btn btn--primary"
          onClick={handleScan}
          disabled={isScanning || isLoading}
        >
          {isScanning ? "Scanning..." : "Scan Pages"}
        </button>
        <button
          className="btn btn--secondary"
          onClick={handleGenerateAll}
          disabled={pageMetas.length === 0 || isLoading}
        >
          {isLoading ? "Generating..." : "Generate All"}
        </button>
        <button
          className="btn btn--accent"
          onClick={handleApplyAll}
          disabled={!pageMetas.some((p) => p.status === "ready")}
        >
          Apply All
        </button>
      </div>

      {error && (
        <div className="hint" style={{ color: "var(--error)" }}>
          {error}
        </div>
      )}

      {isScanning && <div className="loading">Scanning pages...</div>}

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
              {page.currentTitle && (
                <div className="result-field">
                  <label>Current Title</label>
                  <span className="result-current">{page.currentTitle}</span>
                </div>
              )}
              {page.generatedTitle && (
                <div className="result-field">
                  <label>Generated Title</label>
                  <div className="result-preview">
                    {page.generatedTitle}
                    <span className="hint">
                      {" "}
                      ({page.generatedTitle.length} chars)
                    </span>
                  </div>
                </div>
              )}
              {page.generatedDescription && (
                <div className="result-field">
                  <label>Generated Description</label>
                  <div className="result-preview">
                    {page.generatedDescription}
                    <span className="hint">
                      {" "}
                      ({page.generatedDescription.length} chars)
                    </span>
                  </div>
                </div>
              )}
              {page.error && (
                <div className="hint" style={{ color: "var(--error)" }}>
                  {page.error}
                </div>
              )}
              {page.status === "ready" && (
                <button
                  className="btn btn--small btn--primary"
                  onClick={() => handleApply(page.id)}
                  style={{ marginTop: "8px" }}
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!isScanning && pageMetas.length === 0 && (
        <div className="empty-state">
          <p>Click "Scan Pages" to discover pages on this site.</p>
        </div>
      )}
    </div>
  );
}
