import React from "react";

export function Header() {
  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-logo">M</span>
        <h1 className="header-title">MetaMind AI</h1>
      </div>
      <span className="header-badge">Beta</span>
    </header>
  );
}
