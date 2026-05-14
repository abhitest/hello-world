import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { TabNav } from "./components/TabNav";
import { PageSeoPanel } from "./panels/PageSeoPanel";
import { CmsSeoPanel } from "./panels/CmsSeoPanel";
import { AltTextPanel } from "./panels/AltTextPanel";
import { SettingsPanel } from "./panels/SettingsPanel";

export type Tab = "pages" | "cms" | "alt-text" | "settings";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("pages");
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("metamind_token")
  );

  // Capture OAuth token from callback redirect (?token=...&status=connected)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const status = params.get("status");

    if (token && status === "connected") {
      localStorage.setItem("metamind_token", token);
      setIsAuthenticated(true);
      // Clean URL without reloading
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleDisconnect = () => {
    localStorage.removeItem("metamind_token");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    return (
      <div className="app">
        <Header />
        <div className="panel-content">
          <div className="empty-state" style={{ marginTop: "2rem" }}>
            <p style={{ marginBottom: "1rem" }}>
              Connect your Webflow account to get started.
            </p>
            <a
              href={`${backendUrl}/api/auth/authorize`}
              className="btn btn--primary"
            >
              Connect Webflow
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="panel-content">
        {activeTab === "pages" && <PageSeoPanel />}
        {activeTab === "cms" && <CmsSeoPanel />}
        {activeTab === "alt-text" && <AltTextPanel />}
        {activeTab === "settings" && (
          <SettingsPanel onDisconnect={handleDisconnect} />
        )}
      </main>
    </div>
  );
}
