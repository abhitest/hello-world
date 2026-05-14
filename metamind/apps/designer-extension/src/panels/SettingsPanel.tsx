import React, { useState, useEffect } from "react";
import { useBackend } from "../hooks/useBackend";

type Tone = "professional" | "friendly" | "witty" | "technical";

interface BrandSettings {
  brandName: string;
  tone: Tone;
  targetKeywords: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
  language: string;
}

const STORAGE_KEY = "metamind_settings";

const defaultSettings: BrandSettings = {
  brandName: "",
  tone: "professional",
  targetKeywords: "",
  maxTitleLength: 60,
  maxDescriptionLength: 155,
  language: "en",
};

interface SettingsPanelProps {
  onDisconnect?: () => void;
}

export function SettingsPanel({ onDisconnect }: SettingsPanelProps) {
  const { request, isLoading, error } = useBackend();
  const [settings, setSettings] = useState<BrandSettings>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  const [saved, setSaved] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{
    generations: number;
    limit: number;
    plan: string;
  } | null>(null);

  // Fetch usage info on mount
  useEffect(() => {
    const fetchUsage = async () => {
      const res = await request<{
        total: { generations: number };
        limits: { maxGenerations: number; plan: string };
      }>("/api/usage");
      if (res) {
        setUsageInfo({
          generations: res.total.generations,
          limit: res.limits.maxGenerations,
          plan: res.limits.plan,
        });
      }
    };
    fetchUsage();
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Brand Settings</h2>
        <p className="panel-description">
          Configure your brand voice and SEO constraints. These apply to all
          generations.
        </p>
      </div>

      {/* Usage info */}
      {usageInfo && (
        <div
          className="result-card"
          style={{ marginBottom: "16px" }}
        >
          <div className="result-card-header">
            <span className="result-card-name">
              Plan: {usageInfo.plan.charAt(0).toUpperCase() + usageInfo.plan.slice(1)}
            </span>
          </div>
          <div className="result-field">
            <label>Usage This Month</label>
            <span className="result-preview">
              {usageInfo.generations} / {usageInfo.limit} generations
            </span>
          </div>
          <div
            style={{
              marginTop: "8px",
              height: "4px",
              background: "var(--bg-hover)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (usageInfo.generations / usageInfo.limit) * 100)}%`,
                background:
                  usageInfo.generations / usageInfo.limit > 0.8
                    ? "var(--warning)"
                    : "var(--accent)",
                borderRadius: "2px",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="hint" style={{ color: "var(--error)", marginBottom: "12px" }}>
          {error}
        </div>
      )}

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
          <p className="hint">Appended to meta titles (e.g. "Page Title | Brand")</p>
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
          <p className="hint">AI will try to include these in generated titles</p>
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
            <option value="it">Italian</option>
            <option value="nl">Dutch</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        <div className="panel-actions">
          <button className="btn btn--primary" onClick={handleSave}>
            {saved ? "Saved!" : "Save Settings"}
          </button>
          <button className="btn btn--secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Account section */}
      <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
        <div className="form-field">
          <label>Account</label>
          <button
            className="btn btn--secondary"
            onClick={onDisconnect}
            style={{ marginTop: "8px" }}
          >
            Disconnect Webflow Account
          </button>
          <p className="hint" style={{ marginTop: "4px" }}>
            This will log you out and require re-authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
