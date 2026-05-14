import React, { useState } from "react";
import { useBackend } from "../hooks/useBackend";

interface Collection {
  id: string;
  name: string;
  itemCount: number;
}

interface CmsItem {
  id: string;
  name: string;
  generatedTitle?: string;
  generatedDescription?: string;
  generatedOgTitle?: string;
  generatedOgDescription?: string;
  status: "idle" | "generating" | "ready" | "applied" | "error";
  error?: string;
}

export function CmsSeoPanel() {
  const { generateMeta, applyChanges, request, isLoading, error } =
    useBackend();

  const [siteId, setSiteId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [items, setItems] = useState<CmsItem[]>([]);
  const [template, setTemplate] = useState(
    "{{name}} — Expert Guide | {{brand}}"
  );
  const [keyword, setKeyword] = useState("");

  const handleFetchCollections = async () => {
    try {
      // Get the site ID first
      const sitesRes = await request<{ sites: any[] }>("/api/sites");
      if (!sitesRes || !sitesRes.sites?.length) return;

      const site = sitesRes.sites[0];
      setSiteId(site.id);

      // Fetch collections for this site
      const colRes = await request<{ collections: any[] }>(
        `/api/sites/${site.id}/collections`
      );

      if (colRes?.collections) {
        setCollections(
          colRes.collections.map((c: any) => ({
            id: c.id,
            name: c.displayName || c.singularName || c.slug,
            itemCount: c.itemCount || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch collections:", err);
    }
  };

  const handleGenerateCms = async () => {
    if (!siteId || !selectedCollection) return;

    // Mark items as generating (or set a loading state)
    setItems((prev) =>
      prev.map((item) => ({ ...item, status: "generating" as const }))
    );

    const res = await generateMeta({
      siteId,
      collectionId: selectedCollection,
      template,
      keyword: keyword || undefined,
    });

    if (res?.results) {
      const mapped: CmsItem[] = res.results.map((r: any) => ({
        id: r.id,
        name: r.name,
        generatedTitle: r.generated.title,
        generatedDescription: r.generated.description,
        generatedOgTitle: r.generated.ogTitle,
        generatedOgDescription: r.generated.ogDescription,
        status: "ready" as const,
      }));
      setItems(mapped);
    } else {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: "error" as const,
          error: error || "Generation failed",
        }))
      );
    }
  };

  const handleApplyItem = async (itemId: string) => {
    if (!siteId || !selectedCollection) return;

    const item = items.find((i) => i.id === itemId);
    if (!item || !item.generatedTitle) return;

    const res = await applyChanges({
      siteId,
      changes: [
        {
          type: "cms",
          id: itemId,
          collectionId: selectedCollection,
          data: {
            title: item.generatedTitle,
            description: item.generatedDescription,
            ogTitle: item.generatedOgTitle,
            ogDescription: item.generatedOgDescription,
          },
        },
      ],
    });

    if (res?.results?.[0]?.success) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: "applied" as const } : i
        )
      );
    }
  };

  const handleApplyAll = async () => {
    if (!siteId || !selectedCollection) return;

    const readyItems = items.filter((i) => i.status === "ready");
    if (readyItems.length === 0) return;

    const changes = readyItems.map((item) => ({
      type: "cms" as const,
      id: item.id,
      collectionId: selectedCollection,
      data: {
        title: item.generatedTitle,
        description: item.generatedDescription,
        ogTitle: item.generatedOgTitle,
        ogDescription: item.generatedOgDescription,
      },
    }));

    const res = await applyChanges({ siteId, changes });

    if (res?.results) {
      setItems((prev) =>
        prev.map((item) => {
          const result = res.results.find((r: any) => r.id === item.id);
          if (result?.success) {
            return { ...item, status: "applied" as const };
          }
          return item;
        })
      );
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>CMS SEO</h2>
        <p className="panel-description">
          Generate meta tags for CMS collection items using templates with field
          variables.
        </p>
      </div>

      <div className="panel-actions">
        <button
          className="btn btn--primary"
          onClick={handleFetchCollections}
          disabled={isLoading}
        >
          {isLoading && collections.length === 0
            ? "Loading..."
            : "Load Collections"}
        </button>
      </div>

      {error && (
        <div className="hint" style={{ color: "var(--error)" }}>
          {error}
        </div>
      )}

      {collections.length > 0 && (
        <div className="collection-selector">
          <div className="form-field">
            <label>Collection</label>
            <select
              className="input"
              value={selectedCollection || ""}
              onChange={(e) => setSelectedCollection(e.target.value || null)}
            >
              <option value="">Select a collection...</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.itemCount} items)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="template-editor">
        <div className="form-field">
          <label>Title Template</label>
          <input
            type="text"
            className="input"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="{{name}} — {{category}} | Brand"
          />
          <p className="hint">
            Use {"{{fieldName}}"} to reference CMS fields. AI will optimize
            around this pattern.
          </p>
        </div>

        <div className="form-field" style={{ marginTop: "12px" }}>
          <label>Target Keyword (optional)</label>
          <input
            type="text"
            className="input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. web design"
          />
        </div>
      </div>

      <div className="panel-actions" style={{ marginTop: "16px" }}>
        <button
          className="btn btn--primary"
          onClick={handleGenerateCms}
          disabled={!selectedCollection || isLoading}
        >
          {isLoading ? "Generating..." : "Generate for Collection"}
        </button>
        <button
          className="btn btn--accent"
          onClick={handleApplyAll}
          disabled={!items.some((i) => i.status === "ready")}
        >
          Apply All
        </button>
      </div>

      {items.length > 0 && (
        <div className="results-list" style={{ marginTop: "16px" }}>
          {items.map((item) => (
            <div key={item.id} className="result-card">
              <div className="result-card-header">
                <span className="result-card-name">{item.name}</span>
                <span className={`status-badge status--${item.status}`}>
                  {item.status}
                </span>
              </div>
              {item.generatedTitle && (
                <div className="result-field">
                  <label>Title</label>
                  <div className="result-preview">
                    {item.generatedTitle}
                    <span className="hint">
                      {" "}
                      ({item.generatedTitle.length} chars)
                    </span>
                  </div>
                </div>
              )}
              {item.generatedDescription && (
                <div className="result-field">
                  <label>Description</label>
                  <div className="result-preview">
                    {item.generatedDescription}
                    <span className="hint">
                      {" "}
                      ({item.generatedDescription.length} chars)
                    </span>
                  </div>
                </div>
              )}
              {item.error && (
                <div className="hint" style={{ color: "var(--error)" }}>
                  {item.error}
                </div>
              )}
              {item.status === "ready" && (
                <button
                  className="btn btn--small btn--primary"
                  onClick={() => handleApplyItem(item.id)}
                  style={{ marginTop: "8px" }}
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
