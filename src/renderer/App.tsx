import React, {useState, useEffect, useCallback, useRef} from "react";
import {AppInfo, AppState, Table, RollResult} from "../shared/types";
import {StorageService, createDefaultAppState} from "./services/StorageService";
import {FileService} from "./services/FileService";
import {rollOnTable, rerollSubtable} from "../shared/utils/TableRoller";
import "./App.css";
import SearchBar from "./components/SearchBar";
import TableList from "./components/TableList";
import InteractiveRollResult from "./components/InteractiveRollResult";
import {useTableSearch} from "./hooks/useTableSearch";
import {useKeyboardNav} from "./hooks/useKeyboardNav";

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

  // Roll history - stack of previous results
  const [rollHistory, setRollHistory] = useState<
    Array<{
      result: RollResult;
      table: Table;
      timestamp: Date;
    }>
  >([]);

  // Ref for history container to control scrolling
  const historyRef = useRef<HTMLDivElement>(null);

  // History container height state
  const [historyHeight, setHistoryHeight] = useState(() => {
    // Load from localStorage, default to 80px (desktop) / 60px (mobile)
    const saved = localStorage.getItem("oracle-history-height");
    return saved !== null ? parseInt(saved, 10) : 80;
  });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);

  // Scroll history to bottom to show most recent entries
  const scrollHistoryToBottom = useCallback(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, []);

  // Handle resize drag
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startY = e.clientY;
      const startHeight = historyHeight;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(40, Math.min(400, startHeight + deltaY)); // Min 40px, max 400px
        setHistoryHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [historyHeight]
  );

  // Handle touch resize for mobile
  const handleResizeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startY = e.touches[0].clientY;
      const startHeight = historyHeight;

      const handleTouchMove = (e: TouchEvent) => {
        const deltaY = e.touches[0].clientY - startY;
        const newHeight = Math.max(40, Math.min(300, startHeight + deltaY)); // Smaller max on mobile
        setHistoryHeight(newHeight);
      };

      const handleTouchEnd = () => {
        setIsResizing(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [historyHeight]
  );

  // Platform detection for macOS-specific styling
  const [isMacOS, setIsMacOS] = useState(false);

  // Welcome screen visibility
  const [showWelcome, setShowWelcome] = useState(true);

  // History visibility toggle
  const [showHistory, setShowHistory] = useState(() => {
    // Load from localStorage, default to true
    const saved = localStorage.getItem("oracle-show-history");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    filteredTables,
    hasActiveSearch,
    resultCount
  } = useTableSearch(appState.tables);

  // Keyboard navigation
  const keyboardNav = useKeyboardNav({
    itemCount: filteredTables.length,
    onSelect: (index: number) => {
      const actualTable = filteredTables[index];
      const actualIndex = appState.tables.findIndex(
        (table: Table) => table.id === actualTable.id
      );
      handleTableSelect(actualIndex);

      // Automatically roll on the selected table
      setTimeout(() => {
        const rollResult = rollOnTable(actualTable, appState.tables);
        addToHistoryAndSetCurrent(rollResult, actualTable);
      }, 100);
    },
    enableNumberShortcuts: true,
    maxNumberShortcuts: 9,
    loop: true
  });

  // Reset keyboard navigation when search changes
  useEffect(() => {
    if (hasActiveSearch && filteredTables.length > 0) {
      keyboardNav.setSelectedIndex(0);
    } else {
      keyboardNav.resetNavigation();
    }
  }, [searchQuery, hasActiveSearch, filteredTables.length]);

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
        // Detect platform for styling
        setIsMacOS(navigator.platform.toLowerCase().includes("mac"));

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

  // Save history visibility preference
  useEffect(() => {
    localStorage.setItem("oracle-show-history", JSON.stringify(showHistory));
  }, [showHistory]);

  // Save history height preference
  useEffect(() => {
    localStorage.setItem("oracle-history-height", historyHeight.toString());
  }, [historyHeight]);

  // Keyboard shortcut for toggling history (Ctrl+H / Cmd+H)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+H (Windows/Linux) or Cmd+H (macOS)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "h") {
        // Prevent default browser behavior (like opening history)
        event.preventDefault();
        event.stopPropagation();

        // Toggle history visibility
        setShowHistory((prev: boolean) => !prev);
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty dependency array since we only want to set this up once

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
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

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to clear all stored data?\n\nThis will:\n• Remove your vault path\n• Clear all parsed tables\n• Reset all settings\n• Clear roll history\n\nThis action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await StorageService.clearAppState();
      const defaultState = createDefaultAppState();
      defaultState.tables = sampleTables;
      defaultState.lastScanTime = new Date();
      setAppState(defaultState);
      setShowWelcome(true); // Show welcome screen again after clearing storage

      // Clear roll history and current result
      setRollHistory([]);
      setLastRollResult(null);
      setLastRolledTable(null);

      // Reset history visibility to default
      setShowHistory(true);
      localStorage.removeItem("oracle-show-history");

      // Reset history height to default
      setHistoryHeight(80);
      localStorage.removeItem("oracle-history-height");

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
        try {
          await handleScanFiles(selectedPath);

          // Automatically parse tables after scanning (only if scanning succeeded)
          try {
            await handleParseTables(selectedPath);
          } catch (parseError) {
            console.error("Failed to parse tables:", parseError);
            // Don't throw here, just log the error - scanning was successful
          }
        } catch (scanError) {
          console.error("Failed to scan files:", scanError);
          // Don't try to parse if scanning failed
        }
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

  const handleParseTables = async (vaultPath?: string) => {
    const pathToScan = vaultPath || appState.vaultPath;

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

      // Use the table rolling system that resolves subtables
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

  // Reroll function for mouse users
  const handleReroll = () => {
    if (lastRolledTable) {
      const rollResult = rollOnTable(lastRolledTable, appState.tables);
      addToHistoryAndSetCurrent(rollResult, lastRolledTable);
    }
  };

  // Add result to history and set as current
  const addToHistoryAndSetCurrent = (result: RollResult, table: Table) => {
    // Add current result to history if it exists
    if (lastRollResult && lastRolledTable) {
      setRollHistory((prev) => [
        {
          result: lastRollResult,
          table: lastRolledTable,
          timestamp: new Date()
        },
        ...prev.slice(0, 14) // Keep only last 15 results
      ]);

      // Scroll to bottom after adding to history
      setTimeout(scrollHistoryToBottom, 0);
    }

    // Set new current result
    setLastRollResult(result);
    setLastRolledTable(table);
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
      addToHistoryAndSetCurrent(newRollResult, lastRolledTable);
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
    <div className={`app ${isMacOS ? "macos" : ""}`}>
      <header className="app-header">
        <div className="title-bar">
          <h1 className="app-title">Oracle</h1>
          {appInfo && (
            <div className="app-info">
              <span className="version">v{appInfo.version}</span>
              {appInfo.isDev && <span className="dev-badge">DEV</span>}
              <a
                href="https://github.com/script-wizards/oracle"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
                title="View on GitHub"
              >
                <i className="fab fa-github"></i>
              </a>
              <a
                href="https://scriptwizards.org"
                target="_blank"
                rel="noopener noreferrer"
                className="scriptwizards-link"
                title="Visit Script Wizards"
              >
                <i className="fas fa-hat-wizard"></i>
              </a>
            </div>
          )}
        </div>

        <div className="header-controls">
          {/* Vault Controls as Header Buttons - Always visible for consistency */}
          <button
            onClick={handleSelectVault}
            disabled={isSelectingVault}
            className="header-button vault-name"
            title={
              appState.vaultPath
                ? "Click to change vault"
                : "Click to select vault"
            }
          >
            {appState.vaultPath
              ? appState.vaultPath.split("/").pop()
              : isSelectingVault
              ? "selecting..."
              : "load vault"}
          </button>
          <button
            onClick={async () => {
              try {
                await handleScanFiles();
                try {
                  await handleParseTables();
                } catch (parseError) {
                  console.error("Failed to parse tables:", parseError);
                }
              } catch (scanError) {
                console.error("Failed to scan files:", scanError);
              }
            }}
            disabled={isScanningFiles || isParsingTables || !appState.vaultPath}
            className={`header-button refresh-vault ${
              isScanningFiles || isParsingTables ? "spinning" : ""
            }`}
            title={
              appState.vaultPath
                ? "Refresh vault and parse tables"
                : "Select a vault first"
            }
          >
            <i
              className={`fas ${
                isScanningFiles || isParsingTables
                  ? "fa-sync fa-spin"
                  : "fa-sync-alt"
              }`}
            ></i>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="header-button"
            title={
              showHistory
                ? "Hide roll history (Ctrl+H)"
                : "Show roll history (Ctrl+H)"
            }
          >
            <i
              className={`fas ${
                showHistory ? "fa-clock-rotate-left" : "fa-clock-rotate-left"
              }`}
              style={{opacity: showHistory ? 1 : 0.5}}
            ></i>
          </button>

          {storageAvailable && (
            <button
              onClick={handleClearStorage}
              className="header-button clear-storage"
              title="Clear all stored data"
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="welcome-section">
          {/* Welcome and Setup - Only when no vault is selected and welcome is visible */}
          {!appState.vaultPath && showWelcome && (
            <div className="window-container">
              <div className="window-header">
                <span className="window-title">Welcome to Oracle</span>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="window-close-button"
                  title="Close welcome screen"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="window-content">
                <p className="welcome-description">
                  A random table roller for your Obsidian vault. Search through
                  your tables, click to roll, get interactive results with
                  clickable subtables. Built to handle{" "}
                  <a
                    href="https://perchance.org/tutorial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="perchance-link"
                  >
                    Perchance syntax
                  </a>
                  .
                </p>
                <div className="table-format-info">
                  <p className="format-description">
                    Tables should be in markdown code blocks tagged with{" "}
                    <code>perchance</code>:
                  </p>
                  <div className="example-section">
                    <div className="code-example">
                      <pre>
                        <code>{`\`\`\`perchance
title
  Weather

output
  Clear skies
  Light rain
  Heavy fog
  Strong winds
\`\`\``}</code>
                      </pre>
                    </div>
                  </div>
                  <div className="example-section">
                    <p className="format-description">
                      You can also use <code>[brackets]</code> to reference
                      other sections:
                    </p>
                    <div className="code-example">
                      <pre>
                        <code>{`\`\`\`perchance
title
  Forest Encounters

output
  You encounter [creature] near [location]

creature
  A pack of wolves
  A wandering merchant
  An ancient tree spirit

location
  A babbling brook
  An old stone bridge
  A clearing with wildflowers
\`\`\``}</code>
                      </pre>
                    </div>
                  </div>
                </div>
                <p className="welcome-links">
                  Made by{" "}
                  <a
                    href="https://scriptwizards.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="scriptwizards-text-link"
                  >
                    Script Wizards
                  </a>
                  . Source code on{" "}
                  <a
                    href="https://github.com/script-wizards/oracle"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-text-link"
                  >
                    GitHub
                  </a>{" "}
                  if you want to contribute or give feedback.
                </p>
                <p className="setup-instruction">
                  Point it at your{" "}
                  <button
                    onClick={handleSelectVault}
                    disabled={
                      isSelectingVault || !FileService.isElectronAPIAvailable()
                    }
                    className="inline-vault-button"
                    title="Select vault folder"
                  >
                    {isSelectingVault ? "scanning..." : "Obsidian vault"}
                  </button>{" "}
                  and let's roll.
                </p>
              </div>
            </div>
          )}

          {/* File Operation Error Display */}
          {fileOperationError && (
            <div className="error-message-compact">
              <span>❌ {fileOperationError}</span>
              <button
                onClick={() => setFileOperationError(null)}
                className="dismiss-error"
              >
                ×
              </button>
            </div>
          )}

          {/* Spotlight Search Interface */}
          <div className="spotlight-search-section">
            {/* Roll History - Stack grows above */}
            {showHistory && rollHistory.length > 0 && (
              <div className="history-container">
                <div className="history-header">
                  <span className="history-title">History</span>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="history-close-button"
                    title="Hide roll history"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div
                  className="roll-history"
                  ref={historyRef}
                  style={{maxHeight: `${historyHeight}px`}}
                >
                  {rollHistory
                    .slice()
                    .reverse()
                    .map((historyItem, index) => {
                      // Check if we should show timestamp for this item
                      const reversedHistory = rollHistory.slice().reverse();
                      const prevItem =
                        index > 0 ? reversedHistory[index - 1] : null;

                      // Show timestamp if:
                      // 1. It's the first item, OR
                      // 2. More than 1 minute has passed since the previous item
                      const shouldShowTimestamp =
                        !prevItem ||
                        historyItem.timestamp.getTime() -
                          prevItem.timestamp.getTime() >
                          60000; // 60 seconds

                      return (
                        <div
                          key={`${historyItem.timestamp.getTime()}-${index}`}
                          className={`history-item ${
                            !shouldShowTimestamp ? "no-timestamp" : ""
                          }`}
                        >
                          {shouldShowTimestamp && (
                            <div className="history-timestamp">
                              {historyItem.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          )}
                          <InteractiveRollResult
                            rollResult={historyItem.result}
                            onReroll={() => {
                              const rollResult = rollOnTable(
                                historyItem.table,
                                appState.tables
                              );
                              addToHistoryAndSetCurrent(
                                rollResult,
                                historyItem.table
                              );
                            }}
                            onSubtableReroll={(subrollIndex: number) => {
                              const newRollResult = rerollSubtable(
                                historyItem.result,
                                subrollIndex,
                                historyItem.table,
                                appState.tables
                              );
                              addToHistoryAndSetCurrent(
                                newRollResult,
                                historyItem.table
                              );
                            }}
                            lastRolledTable={historyItem.table}
                            isHistoryItem={true}
                          />
                        </div>
                      );
                    })}
                </div>
                <div
                  className="history-resize-handle"
                  onMouseDown={handleResizeStart}
                  onTouchStart={handleResizeTouchStart}
                  style={{cursor: isResizing ? "ns-resize" : "ns-resize"}}
                >
                  <div className="resize-indicator">
                    <i className="fas fa-grip-lines"></i>
                  </div>
                </div>
              </div>
            )}

            {/* Current Roll Result - Most Important */}
            {lastRollResult && (
              <InteractiveRollResult
                rollResult={lastRollResult}
                onReroll={handleReroll}
                onSubtableReroll={handleSubtableReroll}
                lastRolledTable={lastRolledTable}
              />
            )}

            <SearchBar
              onSearch={setSearchQuery}
              onArrowUp={keyboardNav.handleArrowUp}
              onArrowDown={keyboardNav.handleArrowDown}
              onEnter={keyboardNav.handleEnter}
              onEscape={keyboardNav.handleEscape}
              onTab={keyboardNav.handleTab}
              onNumberKey={keyboardNav.handleNumberKey}
              placeholder="Search..."
              value={searchQuery}
              resultCount={resultCount}
              selectedIndex={keyboardNav.selectedIndex}
            />

            {/* Table List - Always visible, filtered by search */}
            <div className="tables-display">
              <TableList
                tables={filteredTables}
                selectedIndex={keyboardNav.selectedIndex}
                onTableSelect={(index: number) => {
                  const actualTable = filteredTables[index];
                  const actualIndex = appState.tables.findIndex(
                    (table: Table) => table.id === actualTable.id
                  );
                  handleTableSelect(actualIndex);

                  // Update keyboard navigation to match
                  keyboardNav.setSelectedIndex(index);

                  // Automatically roll on the selected table
                  setTimeout(() => {
                    const rollResult = rollOnTable(
                      actualTable,
                      appState.tables
                    );
                    addToHistoryAndSetCurrent(rollResult, actualTable);
                  }, 100);
                }}
                searchQuery={searchQuery}
                isKeyboardNavigating={keyboardNav.isNavigating}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="copyright">© SCRIPT WIZARDS</div>
      </footer>
    </div>
  );
};

export default App;
