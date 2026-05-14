import React, { useState } from "react";

interface Collection {
  id: string;
  name: string;
  itemCount: number;
}

export function CmsSeoPanel() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [template, setTemplate] = useState(
    "{{name}} — Expert Guide | {{brand}}"
  );

  const handleFetchCollections = async () => {
    // TODO: Call backend /api/sites/:id/collections
    console.log("Fetching collections...");
  };

  const handleGenerateCms = async () => {
    // TODO: Call backend /api/generate/meta with collection ID + template
    console.log("Generating CMS meta with template:", template);
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
        <button className="btn btn--primary" onClick={handleFetchCollections}>
          Load Collections
        </button>
      </div>

      {collections.length > 0 && (
        <div className="collection-selector">
          <label>Collection</label>
          <select
            value={selectedCollection || ""}
            onChange={(e) => setSelectedCollection(e.target.value)}
          >
            <option value="">Select a collection...</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.itemCount} items)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="template-editor">
        <label>Title Template</label>
        <input
          type="text"
          className="input"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="{{name}} — {{category}} | Brand"
        />
        <p className="hint">
          Use {"{{fieldName}}"} to reference CMS fields. AI will optimize around
          this pattern.
        </p>
      </div>

      <button
        className="btn btn--primary"
        onClick={handleGenerateCms}
        disabled={!selectedCollection}
      >
        Generate for Collection
      </button>
    </div>
  );
}
