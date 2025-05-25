import React, {useState, useEffect, useCallback} from "react";
import {AppInfo, AppState, Table, RollResult} from "../shared/types";
import {StorageService, createDefaultAppState} from "./services/StorageService";
import "./services/StorageService.test"; // Import tests to make them available in console
import "./App.css";

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Initialize app state with default values
  const [appState, setAppState] = useState<AppState>(createDefaultAppState());

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

  // Auto-save functionality
  const saveAppState = useCallback(
    async (state: AppState) => {
      if (!storageAvailable) return;

      try {
        setSaveStatus("saving");
        await StorageService.saveAppState(state);
        setSaveStatus("saved");

        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Failed to save app state:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [storageAvailable]
  );

  // Load initial state and app info
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if storage is available
        const isStorageAvailable = StorageService.isStorageAvailable();
        setStorageAvailable(isStorageAvailable);

        // Load app info from Electron
        if (window.electronAPI) {
          const info = await window.electronAPI.getAppInfo();
          setAppInfo(info);
        }

        // Load stored state if available
        if (isStorageAvailable) {
          const storedState = await StorageService.loadAppState();
          if (storedState) {
            setAppState(storedState);
            console.log("Loaded state from storage:", storedState);
          } else {
            // No stored state, use sample data
            const defaultState = createDefaultAppState();
            defaultState.tables = sampleTables;
            defaultState.lastScanTime = new Date();
            setAppState(defaultState);
          }
        } else {
          // Storage not available, use sample data
          const defaultState = createDefaultAppState();
          defaultState.tables = sampleTables;
          defaultState.lastScanTime = new Date();
          setAppState(defaultState);
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        // Fallback to default state with sample data
        const defaultState = createDefaultAppState();
        defaultState.tables = sampleTables;
        defaultState.lastScanTime = new Date();
        setAppState(defaultState);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [sampleTables]);

  // Auto-save when state changes
  useEffect(() => {
    if (!isLoading && storageAvailable) {
      saveAppState(appState);
    }
  }, [appState, isLoading, storageAvailable, saveAppState]);

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

  const handleVaultPathChange = async (path: string) => {
    try {
      await StorageService.setVaultPath(path);
      setAppState((prev) => ({
        ...prev,
        vaultPath: path,
        lastScanTime: new Date()
      }));
    } catch (error) {
      console.error("Failed to set vault path:", error);
    }
  };

  const handleClearStorage = async () => {
    if (!storageAvailable) return;

    try {
      await StorageService.clearAppState();
      const defaultState = createDefaultAppState();
      defaultState.tables = sampleTables;
      defaultState.lastScanTime = new Date();
      setAppState(defaultState);
      alert("Storage cleared successfully!");
    } catch (error) {
      console.error("Failed to clear storage:", error);
      alert("Failed to clear storage");
    }
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

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case "saving":
        return "💾";
      case "saved":
        return "✅";
      case "error":
        return "❌";
      default:
        return "";
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return "Saved";
      case "error":
        return "Save failed";
      default:
        return "";
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
              {storageAvailable && (
                <span className="storage-status">
                  {getSaveStatusIcon()} {getSaveStatusText()}
                </span>
              )}
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

          {/* Storage and Vault Info */}
          <div className="info-section">
            <div className="info-card">
              <h3>📁 Vault Information</h3>
              <p>
                <strong>Current Path:</strong> {appState.vaultPath || "Not set"}
              </p>
              <p>
                <strong>Tables Loaded:</strong> {appState.tables.length}
              </p>
              <p>
                <strong>Last Scan:</strong>{" "}
                {appState.lastScanTime
                  ? appState.lastScanTime.toLocaleString()
                  : "Never"}
              </p>
              <p>
                <strong>Storage:</strong>{" "}
                {storageAvailable ? "Available" : "Not available"}
              </p>
            </div>
          </div>

          {/* Vault Path Input */}
          <div className="vault-controls">
            <input
              type="text"
              placeholder="Enter vault path..."
              value={appState.vaultPath || ""}
              onChange={(e) => handleVaultPathChange(e.target.value)}
              className="vault-input"
            />
            <button
              onClick={handleClearStorage}
              disabled={!storageAvailable}
              className="clear-storage-button"
              title="Clear all stored data"
            >
              🗑️ Clear Storage
            </button>
          </div>

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
        {!storageAvailable && (
          <p className="storage-warning">
            ⚠️ Local storage is not available. Settings will not persist.
          </p>
        )}
      </footer>
    </div>
  );
};

export default App;
