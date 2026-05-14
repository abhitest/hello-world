import React, { useState } from "react";
import { Header } from "./components/Header";
import { TabNav } from "./components/TabNav";
import { PageSeoPanel } from "./panels/PageSeoPanel";
import { CmsSeoPanel } from "./panels/CmsSeoPanel";
import { AltTextPanel } from "./panels/AltTextPanel";
import { SettingsPanel } from "./panels/SettingsPanel";

export type Tab = "pages" | "cms" | "alt-text" | "settings";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("pages");

  return (
    <div className="app">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="panel-content">
        {activeTab === "pages" && <PageSeoPanel />}
        {activeTab === "cms" && <CmsSeoPanel />}
        {activeTab === "alt-text" && <AltTextPanel />}
        {activeTab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}
