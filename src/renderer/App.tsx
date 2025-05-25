import React, {useState, useEffect} from "react";
import {AppInfo, AppState, Table, RollResult} from "../shared/types";
import "./App.css";

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app state with default values
  const [appState, setAppState] = useState<AppState>({
    vaultPath: undefined,
    tables: [],
    searchQuery: "",
    selectedTableIndex: -1,
    lastScanTime: undefined
  });

  // Sample data for demonstration
  const [sampleTables] = useState<Table[]>([
    {
      id: "sample-1",
      title: "Random Encounters",
      entries: [
        "A group of bandits blocks the road",
        "A merchant caravan approaches",
        "Wild animals cross your path",
        "An abandoned campsite with mysterious clues"
      ],
      subtables: ["weather-table", "npc-reactions"],
      filePath: "/sample/encounters.md",
      codeBlockIndex: 0,
      errors: undefined
    },
    {
      id: "sample-2",
      title: "Weather Conditions",
      entries: [
        "Clear skies and pleasant weather",
        "Light rain begins to fall",
        "Heavy fog reduces visibility",
        "Strong winds make travel difficult"
      ],
      subtables: [],
      filePath: "/sample/weather.md",
      codeBlockIndex: 1,
      errors: ["Missing dice notation in entry 2"]
    }
  ]);

  const [lastRollResult, setLastRollResult] = useState<RollResult | null>(null);

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

  // Load sample tables into app state
  useEffect(() => {
    setAppState((prev) => ({
      ...prev,
      tables: sampleTables,
      lastScanTime: new Date()
    }));
  }, [sampleTables]);

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

  const handleSearchChange = (query: string) => {
    setAppState((prev) => ({
      ...prev,
      searchQuery: query
    }));
  };

  const handleTableSelect = (index: number) => {
    setAppState((prev) => ({
      ...prev,
      selectedTableIndex: index
    }));
  };

  const simulateRoll = () => {
    if (
      appState.selectedTableIndex >= 0 &&
      appState.tables[appState.selectedTableIndex]
    ) {
      const table = appState.tables[appState.selectedTableIndex];
      const randomEntry =
        table.entries[Math.floor(Math.random() * table.entries.length)];

      const rollResult: RollResult = {
        text: randomEntry,
        subrolls: [
          {
            text: randomEntry,
            type: "dice",
            startIndex: 0,
            endIndex: randomEntry.length
          }
        ],
        errors: undefined
      };

      setLastRollResult(rollResult);
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

          {/* Search and Table Selection */}
          <div className="controls-section">
            <input
              type="text"
              placeholder="Search tables..."
              value={appState.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />

            <select
              value={appState.selectedTableIndex}
              onChange={(e) => handleTableSelect(parseInt(e.target.value))}
              className="table-select"
            >
              <option value={-1}>Select a table...</option>
              {appState.tables.map((table, index) => (
                <option key={table.id} value={index}>
                  {table.title} ({table.entries.length} entries)
                </option>
              ))}
            </select>

            <button
              onClick={simulateRoll}
              disabled={appState.selectedTableIndex === -1}
              className="roll-button"
            >
              🎲 Roll Table
            </button>
          </div>

          {/* Last Roll Result */}
          {lastRollResult && (
            <div className="roll-result">
              <h3>Last Roll Result:</h3>
              <p className="result-text">{lastRollResult.text}</p>
            </div>
          )}

          {/* App State Display */}
          <div className="state-display">
            <h3>Current App State (JSON):</h3>
            <pre className="state-json">
              {JSON.stringify(appState, null, 2)}
            </pre>
          </div>

          {/* Sample Tables Display */}
          <div className="tables-display">
            <h3>Loaded Tables:</h3>
            {appState.tables.map((table, index) => (
              <div key={table.id} className="table-card">
                <h4>{table.title}</h4>
                <p>Entries: {table.entries.length}</p>
                <p>File: {table.filePath}</p>
                {table.errors && (
                  <p className="errors">Errors: {table.errors.join(", ")}</p>
                )}
              </div>
            ))}
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
