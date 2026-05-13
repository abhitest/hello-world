import React, { useState } from "react";

type Tone = "professional" | "friendly" | "witty" | "technical";

interface BrandSettings {
  brandName: string;
  tone: Tone;
  targetKeywords: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
  language: string;
}

const defaultSettings: BrandSettings = {
  brandName: "",
  tone: "professional",
  targetKeywords: "",
  maxTitleLength: 60,
  maxDescriptionLength: 155,
  language: "en",
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);

  const handleSave = async () => {
    // TODO: Persist to backend /api/settings
    console.log("Saving settings:", settings);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Brand Settings</h2>
        <p className="panel-description">
          Configure your brand voice and SEO constraints.
        </p>
      </div>

      <div className="form">
        <div className="form-field">
          <label>Brand Name</label>
          <input
            type="text"
            className="input"
            value={settings.brandName}
            onChange={(e) =>
              setSettings({ ...settings, brandName: e.target.value })
            }
            placeholder="Your Brand"
          />
        </div>

        <div className="form-field">
          <label>Tone</label>
          <select
            className="input"
            value={settings.tone}
            onChange={(e) =>
              setSettings({ ...settings, tone: e.target.value as Tone })
            }
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="witty">Witty</option>
            <option value="technical">Technical</option>
          </select>
        </div>

        <div className="form-field">
          <label>Target Keywords (comma-separated)</label>
          <input
            type="text"
            className="input"
            value={settings.targetKeywords}
            onChange={(e) =>
              setSettings({ ...settings, targetKeywords: e.target.value })
            }
            placeholder="seo, webflow, ai"
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Max Title Length</label>
            <input
              type="number"
              className="input"
              value={settings.maxTitleLength}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxTitleLength: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="form-field">
            <label>Max Description Length</label>
            <input
              type="number"
              className="input"
              value={settings.maxDescriptionLength}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxDescriptionLength: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="form-field">
          <label>Language</label>
          <select
            className="input"
            value={settings.language}
            onChange={(e) =>
              setSettings({ ...settings, language: e.target.value })
            }
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="ja">Japanese</option>
          </select>
        </div>

        <button className="btn btn--primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
