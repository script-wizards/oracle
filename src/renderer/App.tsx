import React, {useState, useEffect, useCallback} from "react";
import {AppInfo, AppState, Table, RollResult} from "../shared/types";
import {StorageService, createDefaultAppState} from "./services/StorageService";
import {FileService} from "./services/FileService";
import {rollOnTable, rerollSubtable} from "../shared/utils/TableRoller";
import "./App.css";
import SearchBar from "./components/SearchBar";
import TableList from "./components/TableList";
import InteractiveRollResult from "./components/InteractiveRollResult";
import {useTableSearch} from "./hooks/useTableSearch";

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // File operation states
  const [isSelectingVault, setIsSelectingVault] = useState(false);
  const [isScanningFiles, setIsScanningFiles] = useState(false);
  const [isParsingCodeBlocks, setIsParsingCodeBlocks] = useState(false);
  const [isParsingTables, setIsParsingTables] = useState(false);
  const [scanResults, setScanResults] = useState<{
    fileCount: number;
    estimatedSize: string;
  } | null>(null);
  const [codeBlockResults, setCodeBlockResults] = useState<{
    totalFiles: number;
    filesWithCodeBlocks: number;
    totalCodeBlocks: number;
    totalPerchanceBlocks: number;
    validPerchanceBlocks: number;
    invalidBlocks: number;
    languages: string[];
  } | null>(null);
  const [parseResults, setParseResults] = useState<{
    totalTables: number;
    successfulTables: number;
    failedTables: number;
    filesProcessed: number;
  } | null>(null);
  const [fileOperationError, setFileOperationError] = useState<string | null>(
    null
  );

  // Initialize app state with default values
  const [appState, setAppState] = useState<AppState>(createDefaultAppState());

  // Sample data for demonstration
  const [sampleTables] = useState<Table[]>([
    {
      id: "sample-1",
      title: "Random Encounters",
      entries: [
        "You find a [item] and a [item]",
        "A [npc] approaches with [reaction]",
        "The weather turns [weather] as you travel",
        "An abandoned [location] contains [treasure]"
      ],
      sections: [
        {
          name: "output",
          entries: [
            "You find a [item] and a [item]",
            "A [npc] approaches with [reaction]",
            "The weather turns [weather] as you travel",
            "An abandoned [location] contains [treasure]"
          ]
        },
        {
          name: "item",
          entries: [
            "rusty sword",
            "healing potion",
            "mysterious scroll",
            "bag of coins",
            "enchanted ring"
          ]
        },
        {
          name: "npc",
          entries: [
            "traveling merchant",
            "lost child",
            "wounded soldier",
            "mysterious stranger"
          ]
        },
        {
          name: "reaction",
          entries: [
            "friendly greetings",
            "suspicious glances",
            "urgent warnings",
            "requests for help"
          ]
        },
        {
          name: "weather",
          entries: ["stormy", "foggy", "clear and bright", "cold and windy"]
        },
        {
          name: "location",
          entries: ["watchtower", "cottage", "shrine", "campsite"]
        },
        {
          name: "treasure",
          entries: [
            "a chest of gold",
            "ancient artifacts",
            "magical components",
            "old maps"
          ]
        }
      ],
      subtables: ["item", "npc", "reaction", "weather", "location", "treasure"],
      filePath: "/sample/encounters.md",
      codeBlockIndex: 0,
      errors: undefined
    },
    {
      id: "sample-2",
      title: "Simple Weather",
      entries: [
        "Clear skies and pleasant weather",
        "Light rain begins to fall",
        "Heavy fog reduces visibility",
        "Strong winds make travel difficult"
      ],
      sections: [
        {
          name: "output",
          entries: [
            "Clear skies and pleasant weather",
            "Light rain begins to fall",
            "Heavy fog reduces visibility",
            "Strong winds make travel difficult"
          ]
        }
      ],
      subtables: [],
      filePath: "/sample/weather.md",
      codeBlockIndex: 1,
      errors: undefined
    }
  ]);

  const [lastRollResult, setLastRollResult] = useState<RollResult | null>(null);
  const [lastRolledTable, setLastRolledTable] = useState<Table | null>(null);

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    filteredTables,
    hasActiveSearch,
    resultCount
  } = useTableSearch(appState.tables);

  // Spotlight-style navigation
  const [spotlightSelectedIndex, setSpotlightSelectedIndex] =
    useState<number>(-1);

  // Reset spotlight selection when search changes
  useEffect(() => {
    setSpotlightSelectedIndex(
      hasActiveSearch && filteredTables.length > 0 ? 0 : -1
    );
  }, [searchQuery, hasActiveSearch, filteredTables.length]);

  const handleSpotlightArrowUp = () => {
    if (filteredTables.length === 0) return;
    setSpotlightSelectedIndex((prev) =>
      prev <= 0 ? filteredTables.length - 1 : prev - 1
    );
  };

  const handleSpotlightArrowDown = () => {
    if (filteredTables.length === 0) return;
    setSpotlightSelectedIndex((prev) =>
      prev >= filteredTables.length - 1 ? 0 : prev + 1
    );
  };

  const handleSpotlightEnter = () => {
    if (spotlightSelectedIndex >= 0 && filteredTables[spotlightSelectedIndex]) {
      const selectedTable = filteredTables[spotlightSelectedIndex];
      const actualIndex = appState.tables.findIndex(
        (table) => table.id === selectedTable.id
      );

      // Select the table
      handleTableSelect(actualIndex);

      // Roll on it immediately
      setTimeout(() => {
        const rollResult = rollOnTable(selectedTable, appState.tables);
        setLastRollResult(rollResult);
        setLastRolledTable(selectedTable);
      }, 100);
    }
  };

  const handleSpotlightEscape = () => {
    setSearchQuery("");
    setSpotlightSelectedIndex(-1);
  };

  // Reroll function for mouse users
  const handleReroll = () => {
    if (lastRolledTable) {
      const rollResult = rollOnTable(lastRolledTable, appState.tables);
      setLastRollResult(rollResult);
    }
  };

  // Reroll specific subtable
  const handleSubtableReroll = (subrollIndex: number) => {
    if (lastRollResult && lastRolledTable) {
      const newRollResult = rerollSubtable(
        lastRollResult,
        subrollIndex,
        lastRolledTable,
        appState.tables
      );
      setLastRollResult(newRollResult);
    }
  };

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

    // Set the selected table as the last rolled table for rerolling
    if (index >= 0 && appState.tables[index]) {
      setLastRolledTable(appState.tables[index]);
    }
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

  const handleSelectVault = async () => {
    if (!FileService.isElectronAPIAvailable()) {
      setFileOperationError("File system access not available");
      return;
    }

    try {
      setIsSelectingVault(true);
      setFileOperationError(null);

      const selectedPath = await FileService.selectVaultFolder();

      if (selectedPath) {
        // Update app state with new vault path
        await handleVaultPathChange(selectedPath);

        // Automatically scan files after selection
        await handleScanFiles(selectedPath);
      }
    } catch (error) {
      console.error("Failed to select vault:", error);
      setFileOperationError(
        `Failed to select vault: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSelectingVault(false);
    }
  };

  const handleScanFiles = async (vaultPath?: string) => {
    const pathToScan = vaultPath || appState.vaultPath;

    if (!pathToScan) {
      setFileOperationError("No vault path available to scan");
      return;
    }

    if (!FileService.isElectronAPIAvailable()) {
      setFileOperationError("File system access not available");
      return;
    }

    try {
      setIsScanningFiles(true);
      setFileOperationError(null);

      console.log("About to get vault stats for:", pathToScan);
      const stats = await FileService.getVaultStats(pathToScan);
      console.log("Received vault stats:", stats);

      const newScanResults = {
        fileCount: stats.totalFiles,
        estimatedSize: stats.estimatedSize
      };
      console.log("Setting scan results to:", newScanResults);
      setScanResults(newScanResults);

      // Also parse code blocks automatically
      console.log("Starting automatic code block parsing...");
      const codeBlockStats = await FileService.getVaultCodeBlockStats(
        pathToScan
      );
      console.log("Received code block stats:", codeBlockStats);

      setCodeBlockResults({
        totalFiles: codeBlockStats.totalFiles,
        filesWithCodeBlocks: codeBlockStats.filesWithCodeBlocks,
        totalCodeBlocks: codeBlockStats.totalCodeBlocks,
        totalPerchanceBlocks: codeBlockStats.totalPerchanceBlocks,
        validPerchanceBlocks: codeBlockStats.validPerchanceBlocks,
        invalidBlocks: codeBlockStats.invalidBlocks,
        languages: codeBlockStats.languages
      });

      // Update last scan time
      setAppState((prev) => ({
        ...prev,
        lastScanTime: new Date()
      }));
      console.log(
        "Updated app state with new scan time and code block analysis"
      );
    } catch (error) {
      console.error("Failed to scan files:", error);
      setFileOperationError(
        `Failed to scan files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setScanResults(null);
      setCodeBlockResults(null);
    } finally {
      setIsScanningFiles(false);
    }
  };

  const handleParseCodeBlocks = async (vaultPath?: string) => {
    const pathToScan = vaultPath || appState.vaultPath;

    if (!pathToScan) {
      setFileOperationError("No vault path available to parse");
      return;
    }

    if (!FileService.isElectronAPIAvailable()) {
      setFileOperationError("File system access not available");
      return;
    }

    try {
      setIsParsingCodeBlocks(true);
      setFileOperationError(null);

      console.log("Starting to parse code blocks for:", pathToScan);
      const codeBlockStats = await FileService.getVaultCodeBlockStats(
        pathToScan
      );
      console.log("Received code block stats:", codeBlockStats);

      setCodeBlockResults({
        totalFiles: codeBlockStats.totalFiles,
        filesWithCodeBlocks: codeBlockStats.filesWithCodeBlocks,
        totalCodeBlocks: codeBlockStats.totalCodeBlocks,
        totalPerchanceBlocks: codeBlockStats.totalPerchanceBlocks,
        validPerchanceBlocks: codeBlockStats.validPerchanceBlocks,
        invalidBlocks: codeBlockStats.invalidBlocks,
        languages: codeBlockStats.languages
      });

      console.log("Code block parsing completed successfully");
    } catch (error) {
      console.error("Failed to parse code blocks:", error);
      setFileOperationError(
        `Failed to parse code blocks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setCodeBlockResults(null);
    } finally {
      setIsParsingCodeBlocks(false);
    }
  };

  const handleParseTables = async () => {
    const pathToScan = appState.vaultPath;

    if (!pathToScan) {
      setFileOperationError("No vault path available to parse tables from");
      return;
    }

    if (!FileService.isElectronAPIAvailable()) {
      setFileOperationError("File system access not available");
      return;
    }

    try {
      setIsParsingTables(true);
      setFileOperationError(null);

      console.log("Starting to parse tables from vault:", pathToScan);
      const parsedTables = await FileService.parseAllTablesFromVault(
        pathToScan
      );

      console.log(
        `Successfully parsed ${parsedTables.length} tables from vault`
      );

      // Update app state with parsed tables
      setAppState((prev) => ({
        ...prev,
        tables: parsedTables,
        lastScanTime: new Date()
      }));

      // Update parse results
      setParseResults({
        totalTables: parsedTables.length,
        successfulTables: parsedTables.filter(
          (table) => !table.errors || table.errors.length === 0
        ).length,
        failedTables: parsedTables.filter(
          (table) => table.errors && table.errors.length > 0
        ).length,
        filesProcessed: new Set(parsedTables.map((table) => table.filePath))
          .size
      });

      // Clear selection if current table is no longer available
      if (
        appState.selectedTableIndex >= 0 &&
        appState.selectedTableIndex >= parsedTables.length
      ) {
        setAppState((prev) => ({
          ...prev,
          selectedTableIndex: -1
        }));
        setLastRollResult(null);
      }

      console.log("Table parsing completed successfully");
    } catch (error) {
      console.error("Failed to parse tables:", error);
      setFileOperationError(
        `Failed to parse tables: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setParseResults(null);
    } finally {
      setIsParsingTables(false);
    }
  };

  const simulateRoll = () => {
    if (
      appState.selectedTableIndex >= 0 &&
      appState.tables[appState.selectedTableIndex]
    ) {
      const table = appState.tables[appState.selectedTableIndex];
      console.log(`Rolling on table: "${table.title}"`);

      // Use the new table roller that resolves subtables
      const rollResult = rollOnTable(table, appState.tables);

      console.log("Roll result:", rollResult);
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
              <h3>📁 Vault Status</h3>
              <p>
                <strong>Path:</strong> {appState.vaultPath || "Not set"}
              </p>
              <p>
                <strong>Tables:</strong> {appState.tables.length} loaded
              </p>
              {scanResults && (
                <p>
                  <strong>Files:</strong> {scanResults.fileCount} markdown files
                  ({scanResults.estimatedSize})
                </p>
              )}
              {codeBlockResults && (
                <p>
                  <strong>Perchance Blocks:</strong>{" "}
                  {codeBlockResults.validPerchanceBlocks} valid,{" "}
                  {codeBlockResults.invalidBlocks} invalid
                </p>
              )}
              {parseResults && (
                <p>
                  <strong>Parse Results:</strong>{" "}
                  {parseResults.successfulTables} successful,{" "}
                  {parseResults.failedTables} failed from{" "}
                  {parseResults.filesProcessed} files
                </p>
              )}
              <p>
                <strong>Last Scan:</strong>{" "}
                {appState.lastScanTime
                  ? appState.lastScanTime.toLocaleString()
                  : "Never"}
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
              onClick={handleSelectVault}
              disabled={
                isSelectingVault || !FileService.isElectronAPIAvailable()
              }
              className="select-vault-button"
              title="Select vault folder"
            >
              {isSelectingVault ? "🔍 Selecting..." : "📁 Select Vault"}
            </button>
            <button
              onClick={() => handleScanFiles()}
              disabled={isScanningFiles || !appState.vaultPath}
              className="scan-files-button"
              title="Scan vault for markdown files and analyze code blocks"
            >
              {isScanningFiles ? "🔄 Scanning..." : "🔍 Scan & Analyze"}
            </button>
            <button
              onClick={handleParseTables}
              disabled={isParsingTables || !appState.vaultPath}
              className="parse-tables-button"
              title="Parse Perchance tables from code blocks"
            >
              {isParsingTables ? "🔄 Parsing..." : "🎲 Parse Tables"}
            </button>
            <button
              onClick={handleClearStorage}
              disabled={!storageAvailable}
              className="clear-storage-button"
              title="Clear all stored data"
            >
              🗑️ Clear Storage
            </button>
          </div>

          {/* File Operation Error Display */}
          {fileOperationError && (
            <div className="error-message">
              <p>❌ {fileOperationError}</p>
              <button
                onClick={() => setFileOperationError(null)}
                className="dismiss-error-button"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Spotlight Search Interface */}
          <div className="spotlight-search-section">
            <SearchBar
              onSearch={setSearchQuery}
              onArrowUp={handleSpotlightArrowUp}
              onArrowDown={handleSpotlightArrowDown}
              onEnter={handleSpotlightEnter}
              onEscape={handleSpotlightEscape}
              placeholder="Search tables... (↑↓ to navigate, Enter to roll)"
              value={searchQuery}
            />

            {/* Immediate Roll Result - Most Important */}
            {lastRollResult && (
              <InteractiveRollResult
                rollResult={lastRollResult}
                onReroll={handleReroll}
                onSubtableReroll={handleSubtableReroll}
                lastRolledTable={lastRolledTable}
              />
            )}

            {/* Table List - Always visible, filtered by search */}
            <div className="tables-display">
              <TableList
                tables={filteredTables}
                selectedIndex={
                  hasActiveSearch
                    ? spotlightSelectedIndex
                    : filteredTables.findIndex(
                        (table: Table) =>
                          table === appState.tables[appState.selectedTableIndex]
                      )
                }
                onTableSelect={(index: number) => {
                  const actualTable = filteredTables[index];
                  const actualIndex = appState.tables.findIndex(
                    (table: Table) => table.id === actualTable.id
                  );
                  handleTableSelect(actualIndex);

                  // Update spotlight selection to match
                  setSpotlightSelectedIndex(index);

                  // Automatically roll on the selected table
                  setTimeout(() => {
                    const rollResult = rollOnTable(
                      actualTable,
                      appState.tables
                    );
                    setLastRollResult(rollResult);
                    setLastRolledTable(actualTable);
                  }, 100);
                }}
                searchQuery={searchQuery}
              />
            </div>
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
