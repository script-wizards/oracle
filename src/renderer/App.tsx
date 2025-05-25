import React, {useState, useEffect} from "react";
import {AppInfo} from "../shared/types";
import "./App.css";

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get app info from Electron main process
    const loadAppInfo = async () => {
      try {
        if (window.electronAPI) {
          const info = await window.electronAPI.getAppInfo();
          setAppInfo(info);
        }
      } catch (error) {
        console.error("Failed to load app info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppInfo();
  }, []);

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeWindow();
    }
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="title-bar">
          <h1 className="app-title">Random Table Roller</h1>
          {appInfo && (
            <div className="app-info">
              <span className="version">v{appInfo.version}</span>
              {appInfo.isDev && <span className="dev-badge">DEV</span>}
            </div>
          )}
        </div>

        {/* Custom window controls (optional - for custom title bar) */}
        <div className="window-controls">
          <button
            className="window-control minimize"
            onClick={handleMinimize}
            title="Minimize"
          >
            −
          </button>
          <button
            className="window-control maximize"
            onClick={handleMaximize}
            title="Maximize"
          >
            □
          </button>
          <button
            className="window-control close"
            onClick={handleClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="welcome-section">
          <h2>Welcome to Random Table Roller</h2>
          <p>Your desktop companion for tabletop gaming random tables.</p>

          <div className="feature-grid">
            <div className="feature-card">
              <h3>🎲 Roll Tables</h3>
              <p>Create and roll custom random tables for your games.</p>
            </div>

            <div className="feature-card">
              <h3>📚 Library</h3>
              <p>Organize your tables in collections and categories.</p>
            </div>

            <div className="feature-card">
              <h3>⚡ Quick Roll</h3>
              <p>Fast access to your most-used tables.</p>
            </div>

            <div className="feature-card">
              <h3>💾 Save Results</h3>
              <p>Keep track of your roll history and results.</p>
            </div>
          </div>

          <div className="action-section">
            <button className="primary-button">Create Your First Table</button>
            <button className="secondary-button">Import Sample Tables</button>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Ready to enhance your tabletop gaming experience!</p>
      </footer>
    </div>
  );
};

export default App;
