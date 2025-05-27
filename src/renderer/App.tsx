import React, {useState, useEffect, useCallback, useRef} from "react";
import {AppInfo, AppState, Table, RollResult} from "../shared/types";
import {StorageService, createDefaultAppState} from "./services/StorageService";
import {FileService} from "./services/FileService";
import {rollOnTable, rerollSubtable} from "../shared/utils/TableRoller";
import "./App.css";
import SearchBar from "./components/SearchBar";
import TableList from "./components/TableList";
import InteractiveRollResult from "./components/InteractiveRollResult";
import {DraggableWindow} from "./components/DraggableWindow";
import {TableWindow} from "./components/TableWindow";
import {useTableSearch} from "./hooks/useTableSearch";
import {useKeyboardNav} from "./hooks/useKeyboardNav";
import {
  useTranslations,
  initializeLanguage,
  setLanguage,
  getCurrentLanguage,
  Language
} from "./i18n";

const App: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const t = useTranslations();
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
      title: "Basic Weather",
      entries: [
        "Sunny and warm",
        "Cloudy with light breeze",
        "Rainy and cool",
        "Foggy and mysterious",
        "Stormy with heavy winds",
        "Clear and cold"
      ],
      sections: [
        {
          name: "output",
          entries: [
            "Sunny and warm",
            "Cloudy with light breeze",
            "Rainy and cool",
            "Foggy and mysterious",
            "Stormy with heavy winds",
            "Clear and cold"
          ]
        }
      ],
      subtables: [],
      filePath: "/sample/basic-weather.md",
      codeBlockIndex: 0,
      errors: undefined
    },
    {
      id: "sample-2",
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
      codeBlockIndex: 1,
      errors: undefined
    },
    {
      id: "sample-3",
      title: "Tavern Names",
      entries: [
        "The Prancing Pony",
        "The Golden Griffin",
        "The Drunken Dragon",
        "The Silver Stag",
        "The Laughing Maiden",
        "The Rusty Anchor"
      ],
      sections: [
        {
          name: "output",
          entries: [
            "The Prancing Pony",
            "The Golden Griffin",
            "The Drunken Dragon",
            "The Silver Stag",
            "The Laughing Maiden",
            "The Rusty Anchor"
          ]
        }
      ],
      subtables: [],
      filePath: "/sample/taverns.md",
      codeBlockIndex: 2,
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

      // Always use vertical resize (height adjustment)
      const startY = e.clientY;
      const startHeight = historyHeight;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        // Check if we're in sidebar mode for different height limits
        const isSidebarMode = window.innerWidth >= 1200;
        const minHeight = 40;
        const maxHeight = isSidebarMode ? 600 : 400; // Allow taller height in sidebar mode
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
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

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Canvas menu state
  const [showCanvasMenu, setShowCanvasMenu] = useState(false);

  // Canvas add button position
  const [canvasButtonPosition, setCanvasButtonPosition] = useState(() => {
    const saved = localStorage.getItem("oracle-canvas-button-position");
    return saved !== null ? JSON.parse(saved) : { x: 20, y: 20 }; // Default bottom-left (20px from bottom and left)
  });

  // Canvas mode state
  const [isCanvasMode, setIsCanvasMode] = useState(() => {
    const saved = localStorage.getItem("oracle-canvas-mode");
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  const [openWindows, setOpenWindows] = useState<{
    welcome: boolean;
    search: boolean;
    history: boolean;
    currentResult: boolean;
  }>(() => {
    const saved = localStorage.getItem("oracle-open-windows");
    return saved !== null ? JSON.parse(saved) : {
      welcome: true,
      search: true,
      history: true,
      currentResult: false
    };
  });

  // Table windows state - tracks which table windows are open
  const [openTableWindows, setOpenTableWindows] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("oracle-open-table-windows");
    return saved !== null ? new Set(JSON.parse(saved)) : new Set();
  });

  // Z-index management for window stacking
  const [windowZIndices, setWindowZIndices] = useState<{[key: string]: number}>({
    welcome: 10,
    search: 5,
    history: 3,
    currentResult: 8
  });
  const [nextZIndex, setNextZIndex] = useState(20);

  // Window positions and sizes state
  const [windowStates, setWindowStates] = useState<{
    [key: string]: {
      position: { x: number; y: number };
      size: { width: number; height: number };
    };
  }>(() => {
    const saved = localStorage.getItem("oracle-window-states");
    return saved !== null ? JSON.parse(saved) : {
      welcome: {
        position: { x: 200, y: 100 },
        size: { width: 500, height: 400 }
      },
      search: {
        position: { x: 100, y: 150 },
        size: { width: 450, height: 500 }
      },
      history: {
        position: { x: 600, y: 100 },
        size: { width: 400, height: 500 }
      },
      currentResult: {
        position: { x: 300, y: 200 },
        size: { width: 450, height: 350 }
      }
    };
  });

  // Helper function to get default position for new table windows
  const getDefaultTableWindowPosition = (tableId: string): { x: number; y: number } => {
    // Stagger new windows so they don't all appear in the same spot
    const openTableCount = openTableWindows.size;
    const baseX = 150;
    const baseY = 120;
    const offsetX = (openTableCount % 3) * 50;
    const offsetY = Math.floor(openTableCount / 3) * 50;
    
    return {
      x: baseX + offsetX,
      y: baseY + offsetY
    };
  };

  // Helper function to get window state for table windows
  const getTableWindowState = (tableId: string) => {
    const key = `table-${tableId}`;
    return windowStates[key] || {
      position: getDefaultTableWindowPosition(tableId),
      size: { width: 400, height: 450 }
    };
  };

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() =>
    getCurrentLanguage()
  );

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
        // Initialize language system (renderer process only)
        initializeLanguage();

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

  // Save canvas mode preference
  useEffect(() => {
    localStorage.setItem("oracle-canvas-mode", JSON.stringify(isCanvasMode));
  }, [isCanvasMode]);

  // Save open windows state
  useEffect(() => {
    localStorage.setItem("oracle-open-windows", JSON.stringify(openWindows));
  }, [openWindows]);

  // Save window states (positions and sizes)
  useEffect(() => {
    localStorage.setItem("oracle-window-states", JSON.stringify(windowStates));
  }, [windowStates]);

  // Save open table windows
  useEffect(() => {
    localStorage.setItem("oracle-open-table-windows", JSON.stringify(Array.from(openTableWindows)));
  }, [openTableWindows]);

  // Save canvas button position
  useEffect(() => {
    localStorage.setItem("oracle-canvas-button-position", JSON.stringify(canvasButtonPosition));
  }, [canvasButtonPosition]);



  // Keyboard shortcut for toggling history (Ctrl+H / Cmd+H)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+H (Windows/Linux) or Cmd+H (macOS)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "h") {
        // Prevent default browser behavior (like opening history)
        event.preventDefault();
        event.stopPropagation();

        if (isCanvasMode) {
          // In canvas mode, toggle the history window (only if there's history to show)
          if (rollHistory.length > 0) {
            setOpenWindows(prev => ({ 
              ...prev, 
              history: !prev.history
            }));
          }
        } else {
          // In normal mode, toggle history visibility
          setShowHistory((prev: boolean) => !prev);
        }
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCanvasMode, rollHistory.length]); // Include dependencies for canvas mode and history length

  // Close mobile menu and canvas menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showMobileMenu) {
        if (
          !target.closest(".header-controls") &&
          !target.closest(".mobile-menu-dropdown")
        ) {
          setShowMobileMenu(false);
        }
      }
      
      if (showCanvasMenu) {
        if (
          !target.closest(".canvas-add-button-container")
        ) {
          setShowCanvasMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileMenu, showCanvasMenu]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setAppState((prev) => ({
      ...prev,
      searchQuery: query
    }));
  };

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
    setCurrentLanguage(language);
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
    const confirmed = window.confirm(t.clearStorage.confirmMessage);

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

      // Reset canvas mode and window states
      setIsCanvasMode(false);
      localStorage.removeItem("oracle-canvas-mode");
      
      setOpenWindows({
        welcome: true,
        search: true,
        history: true,
        currentResult: false
      });
      localStorage.removeItem("oracle-open-windows");
      
      setWindowStates({
        welcome: {
          position: { x: 200, y: 100 },
          size: { width: 500, height: 400 }
        },
        search: {
          position: { x: 100, y: 150 },
          size: { width: 450, height: 500 }
        },
        history: {
          position: { x: 600, y: 100 },
          size: { width: 400, height: 500 }
        },
        currentResult: {
          position: { x: 300, y: 200 },
          size: { width: 450, height: 350 }
        }
      });
      localStorage.removeItem("oracle-window-states");
      
      setOpenTableWindows(new Set());
      localStorage.removeItem("oracle-open-table-windows");



      alert(t.clearStorage.successMessage);
    } catch (error) {
      console.error("Failed to clear storage:", error);
      alert(t.clearStorage.failedMessage);
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
        return t.status.saving;
      case "saved":
        return t.status.saved;
      case "error":
        return t.status.saveFailed;
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

    // Update selected table index to match the rolled table
    const tableIndex = appState.tables.findIndex(t => t.id === table.id);
    if (tableIndex >= 0) {
      setAppState((prev) => ({
        ...prev,
        selectedTableIndex: tableIndex
      }));
    }

    // Update keyboard navigation to match the rolled table in filtered results
    const filteredIndex = filteredTables.findIndex(t => t.id === table.id);
    if (filteredIndex >= 0) {
      keyboardNav.setSelectedIndex(filteredIndex);
    }

    // In canvas mode, show the current result window
    if (isCanvasMode) {
      setOpenWindows(prev => ({ ...prev, currentResult: true }));
    }
  };

  // Toggle canvas mode
  const toggleCanvasMode = () => {
    setIsCanvasMode(!isCanvasMode);
    if (!isCanvasMode) {
      // Entering canvas mode - show relevant windows
      setOpenWindows({
        welcome: !appState.vaultPath && showWelcome,
        search: true,
        history: showHistory && rollHistory.length > 0,
        currentResult: !!lastRollResult
      });
    }
  };

  // Window management functions
  const closeWindow = (windowName: keyof typeof openWindows) => {
    setOpenWindows(prev => ({ ...prev, [windowName]: false }));
  };

  const openWindow = (windowName: keyof typeof openWindows) => {
    setOpenWindows(prev => ({ ...prev, [windowName]: true }));
  };

  // Table window management functions
  const openTableWindow = (table: Table) => {
    const tableWindowKey = `table-${table.id}`;
    setOpenTableWindows(prev => new Set([...prev, table.id]));
    
    // Initialize z-index for new table window if it doesn't exist
    if (!windowZIndices[tableWindowKey]) {
      setWindowZIndices(prev => ({
        ...prev,
        [tableWindowKey]: nextZIndex
      }));
      setNextZIndex(prev => prev + 1);
    }
  };

  const closeTableWindow = (tableId: string) => {
    setOpenTableWindows(prev => {
      const newSet = new Set(prev);
      newSet.delete(tableId);
      return newSet;
    });
  };

  // Window state update functions
  const updateWindowPosition = (windowName: string, position: { x: number; y: number }) => {
    setWindowStates(prev => ({
      ...prev,
      [windowName]: {
        ...prev[windowName],
        position
      }
    }));
  };

  const updateWindowSize = (windowName: string, size: { width: number; height: number }) => {
    setWindowStates(prev => ({
      ...prev,
      [windowName]: {
        ...prev[windowName],
        size
      }
    }));
  };

  // Bring window to front
  const bringWindowToFront = (windowName: string) => {
    setWindowZIndices(prev => ({
      ...prev,
      [windowName]: nextZIndex
    }));
    setNextZIndex(prev => prev + 1);
  };

  // Table window state update functions
  const updateTableWindowPosition = (tableId: string, position: { x: number; y: number }) => {
    const key = `table-${tableId}`;
    updateWindowPosition(key, position);
  };

  const updateTableWindowSize = (tableId: string, size: { width: number; height: number }) => {
    const key = `table-${tableId}`;
    updateWindowSize(key, size);
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

  // Generate Perchance table definition for viewing
  const generateTableDefinition = (table: Table): string => {
    let definition = `title\n  ${table.title}\n\n`;

    // Add each section
    if (table.sections) {
      table.sections.forEach((section) => {
        definition += `${section.name}\n`;
        section.entries.forEach((entry) => {
          definition += `  ${entry}\n`;
        });
        definition += "\n";
      });
    }

    return definition.trim();
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">{t.status.loading}</div>
      </div>
    );
  }

  return (
    <div className={`app ${isMacOS ? "macos" : ""} ${isCanvasMode ? "canvas-mode" : ""}`}>
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
                title={t.tooltips.viewOnGitHub}
              >
                <i className="fab fa-github"></i>
              </a>
              <a
                href="https://scriptwizards.org"
                target="_blank"
                rel="noopener noreferrer"
                className="scriptwizards-link"
                title={t.tooltips.visitScriptWizards}
              >
                <i className="fas fa-hat-wizard"></i>
              </a>
            </div>
          )}
        </div>

        <div className="header-controls">
          {/* Canvas Mode Toggle */}
          <button
            onClick={toggleCanvasMode}
            className={`header-button ${isCanvasMode ? "active" : ""}`}
            title="Toggle Canvas Mode"
          >
            <i className={`fas ${isCanvasMode ? "fa-table-list" : "fa-layer-group"}`}></i>
          </button>

          {/* Unified Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="header-button hamburger-menu"
            title={t.mobileMenu.menu}
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Menu Dropdown */}
          {showMobileMenu && (
            <div className="mobile-menu-dropdown">
              <button
                onClick={() => {
                  handleSelectVault();
                  setShowMobileMenu(false);
                }}
                disabled={isSelectingVault}
                className="mobile-menu-item"
              >
                <i className="fas fa-folder"></i>
                {appState.vaultPath
                  ? t.mobileMenu.changeVault
                  : isSelectingVault
                  ? "..."
                  : t.mobileMenu.loadVault}
              </button>

              <button
                onClick={async () => {
                  setShowMobileMenu(false);
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
                disabled={
                  isScanningFiles || isParsingTables || !appState.vaultPath
                }
                className="mobile-menu-item"
              >
                <i
                  className={`fas ${
                    isScanningFiles || isParsingTables
                      ? "fa-sync fa-spin"
                      : "fa-sync-alt"
                  }`}
                ></i>
                {t.mobileMenu.refreshVault}
              </button>

              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowMobileMenu(false);
                }}
                className="mobile-menu-item"
              >
                <i className="fas fa-clock-rotate-left"></i>
                {showHistory
                  ? t.mobileMenu.hideHistory
                  : t.mobileMenu.showHistory}
              </button>

              <div className="mobile-menu-item language-item">
                <i className="fas fa-globe"></i>
                <select
                  value={currentLanguage}
                  onChange={(e) => {
                    handleLanguageChange(e.target.value as Language);
                    setShowMobileMenu(false);
                  }}
                  className="language-select-mobile"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ja">日本語</option>
                </select>
              </div>

              {storageAvailable && (
                <button
                  onClick={() => {
                    handleClearStorage();
                    setShowMobileMenu(false);
                  }}
                  className="mobile-menu-item clear-storage"
                >
                  <i className="fas fa-trash"></i>
                  {t.mobileMenu.clearStorage}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {/* Canvas Mode */}
        {isCanvasMode ? (
          <div className="canvas-container">
            {/* Canvas Add Button */}
            <div 
              className="canvas-add-button-container"
              style={{
                bottom: `${canvasButtonPosition.y}px`,
                left: `${canvasButtonPosition.x}px`
              }}
            >
              <button
                className="canvas-add-button"
                onClick={(e) => {
                  // Only open menu if we didn't drag
                  if (!e.currentTarget.dataset.dragged) {
                    setShowCanvasMenu(!showCanvasMenu);
                  }
                  // Reset drag flag
                  delete e.currentTarget.dataset.dragged;
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const button = e.currentTarget;
                  const startX = e.clientX - canvasButtonPosition.x;
                  const startY = e.clientY;
                  const startBottom = canvasButtonPosition.y;
                  let hasDragged = false;

                  const handleMouseMove = (e: MouseEvent) => {
                    hasDragged = true;
                    button.dataset.dragged = "true";
                    
                    // Get header and footer heights to constrain movement
                    const header = document.querySelector('.app-header') as HTMLElement;
                    const footer = document.querySelector('.app-footer') as HTMLElement;
                    const headerHeight = header ? header.offsetHeight : 40; // Default 40px if not found
                    const footerHeight = footer ? footer.offsetHeight : 24; // Default 24px if not found
                    
                    // Consistent margin from all edges
                    const margin = 10;
                    const buttonSize = 40; // Button is 40px wide/tall
                    
                    // Calculate available canvas area with consistent margins
                    const minX = margin;
                    const maxX = window.innerWidth - buttonSize - margin;
                    const minY = footerHeight + margin; // Distance from bottom (footer height + margin)
                    const maxY = window.innerHeight - headerHeight - buttonSize - margin; // Distance from bottom, accounting for header + margin
                    
                    const newX = Math.max(minX, Math.min(maxX, e.clientX - startX));
                    const newY = Math.max(minY, Math.min(maxY, startBottom + (startY - e.clientY)));
                    setCanvasButtonPosition({ x: newX, y: newY });
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                    
                    // If we didn't drag, allow the click to proceed
                    if (!hasDragged) {
                      delete button.dataset.dragged;
                    }
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
                title="Add Window (drag to move)"
              >
                <i className="fas fa-plus"></i>
              </button>
              
              {/* Canvas Menu */}
              {showCanvasMenu && (
                <div className="canvas-menu">
                  <button
                    onClick={() => {
                      openWindow('welcome');
                      setShowCanvasMenu(false);
                    }}
                    className="canvas-menu-item"
                    disabled={openWindows.welcome}
                  >
                    <i className="fas fa-home"></i>
                    Welcome
                  </button>
                  <button
                    onClick={() => {
                      openWindow('search');
                      setShowCanvasMenu(false);
                    }}
                    className="canvas-menu-item"
                    disabled={openWindows.search}
                  >
                    <i className="fas fa-search"></i>
                    Search
                  </button>
                  <button
                    onClick={() => {
                      openWindow('history');
                      setShowCanvasMenu(false);
                    }}
                    className="canvas-menu-item"
                    disabled={openWindows.history || rollHistory.length === 0}
                  >
                    <i className="fas fa-history"></i>
                    History
                  </button>
                  <button
                    onClick={() => {
                      openWindow('currentResult');
                      setShowCanvasMenu(false);
                    }}
                    className="canvas-menu-item"
                    disabled={openWindows.currentResult || !lastRollResult}
                  >
                    <i className="fas fa-dice-d20"></i>
                    Current Roll
                  </button>
                </div>
              )}
            </div>

            {/* Welcome Window */}
            {openWindows.welcome && !appState.vaultPath && (
              <DraggableWindow
                title="Welcome"
                initialPosition={windowStates.welcome.position}
                initialSize={windowStates.welcome.size}
                onClose={() => closeWindow('welcome')}
                onPositionChange={(position) => updateWindowPosition('welcome', position)}
                onSizeChange={(size) => updateWindowSize('welcome', size)}
                onBringToFront={() => bringWindowToFront('welcome')}
                zIndex={windowZIndices.welcome}
              >
                <div className="window-content">
                  <div className="welcome-window-content">
                    <p className="welcome-description">
                    {(() => {
                      const parts = t.welcome.description.split("{perchanceLink}");
                      return (
                        <>
                          {parts[0]}
                          <a
                            href="https://perchance.org/tutorial"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="perchance-link"
                          >
                            Perchance syntax
                          </a>
                          {parts[1] || ""}
                        </>
                      );
                    })()}
                  </p>
                  <p className="setup-instruction">
                    {t.welcome.setupInstruction}{" "}
                    <button
                      onClick={handleSelectVault}
                      disabled={isSelectingVault || !FileService.isElectronAPIAvailable()}
                      className="inline-vault-button"
                      title={t.tooltips.selectVaultFolder}
                    >
                      {isSelectingVault ? "..." : t.welcome.obsidianVault}
                    </button>{" "}
                    {t.welcome.letsRoll}
                  </p>
                  </div>
                </div>
              </DraggableWindow>
            )}

            {/* Search Window */}
            {openWindows.search && (
              <DraggableWindow
                title="Search"
                initialPosition={windowStates.search.position}
                initialSize={windowStates.search.size}
                onClose={() => closeWindow('search')}
                onPositionChange={(position) => updateWindowPosition('search', position)}
                onSizeChange={(size) => updateWindowSize('search', size)}
                onBringToFront={() => bringWindowToFront('search')}
                zIndex={windowZIndices.search}
              >
                <div style={{ padding: '12px' }}>
                  <SearchBar
                    onSearch={setSearchQuery}
                    onArrowUp={keyboardNav.handleArrowUp}
                    onArrowDown={keyboardNav.handleArrowDown}
                    onEnter={keyboardNav.handleEnter}
                    onEscape={keyboardNav.handleEscape}
                    onTab={keyboardNav.handleTab}
                    onNumberKey={keyboardNav.handleNumberKey}
                    value={searchQuery}
                    resultCount={resultCount}
                    selectedIndex={keyboardNav.selectedIndex}
                  />
                  <div className="tables-display" style={{ marginTop: '12px' }}>
                    <TableList
                      tables={filteredTables}
                      selectedIndex={keyboardNav.selectedIndex}
                      onTableSelect={(index: number) => {
                        const actualTable = filteredTables[index];
                        const actualIndex = appState.tables.findIndex(
                          (table: Table) => table.id === actualTable.id
                        );
                        handleTableSelect(actualIndex);
                        keyboardNav.setSelectedIndex(index);
                        setTimeout(() => {
                          const rollResult = rollOnTable(actualTable, appState.tables);
                          addToHistoryAndSetCurrent(rollResult, actualTable);
                        }, 100);
                      }}
                      onTableOpen={openTableWindow}
                      searchQuery={searchQuery}
                      isKeyboardNavigating={keyboardNav.isNavigating}
                      rollResult={lastRollResult || undefined}
                      lastRolledTable={lastRolledTable || undefined}
                    />
                  </div>
                </div>
              </DraggableWindow>
            )}

            {/* History Window */}
            {openWindows.history && rollHistory.length > 0 && (
              <DraggableWindow
                title="Roll History"
                initialPosition={windowStates.history.position}
                initialSize={windowStates.history.size}
                onClose={() => closeWindow('history')}
                onPositionChange={(position) => updateWindowPosition('history', position)}
                onSizeChange={(size) => updateWindowSize('history', size)}
                onBringToFront={() => bringWindowToFront('history')}
                zIndex={windowZIndices.history}
              >
                <div className="roll-history" style={{ padding: '8px', height: '100%', overflow: 'auto' }}>
                  {rollHistory
                    .slice()
                    .reverse()
                    .map((historyItem, index) => {
                      const reversedHistory = rollHistory.slice().reverse();
                      const prevItem = index > 0 ? reversedHistory[index - 1] : null;
                      const shouldShowTimestamp =
                        !prevItem ||
                        historyItem.timestamp.getTime() - prevItem.timestamp.getTime() > 60000;

                      return (
                        <div
                          key={`${historyItem.timestamp.getTime()}-${index}`}
                          className={`history-item ${!shouldShowTimestamp ? "no-timestamp" : ""}`}
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
                              const rollResult = rollOnTable(historyItem.table, appState.tables);
                              addToHistoryAndSetCurrent(rollResult, historyItem.table);
                            }}
                            onSubtableReroll={(subrollIndex: number) => {
                              const newRollResult = rerollSubtable(
                                historyItem.result,
                                subrollIndex,
                                historyItem.table,
                                appState.tables
                              );
                              addToHistoryAndSetCurrent(newRollResult, historyItem.table);
                            }}
                            lastRolledTable={historyItem.table}
                            isHistoryItem={true}
                          />
                        </div>
                      );
                    })}
                </div>
              </DraggableWindow>
            )}

            {/* Current Result Window */}
            {openWindows.currentResult && lastRollResult && (
              <DraggableWindow
                title="Current Roll"
                initialPosition={windowStates.currentResult.position}
                initialSize={windowStates.currentResult.size}
                onClose={() => closeWindow('currentResult')}
                onPositionChange={(position) => updateWindowPosition('currentResult', position)}
                onSizeChange={(size) => updateWindowSize('currentResult', size)}
                onBringToFront={() => bringWindowToFront('currentResult')}
                zIndex={windowZIndices.currentResult}
              >
                <div style={{ padding: '12px' }}>
                  <InteractiveRollResult
                    rollResult={lastRollResult}
                    onReroll={handleReroll}
                    onSubtableReroll={handleSubtableReroll}
                    lastRolledTable={lastRolledTable}
                  />
                </div>
              </DraggableWindow>
            )}

            {/* Table Windows */}
            {Array.from(openTableWindows).map((tableId) => {
              const table = appState.tables.find(t => t.id === tableId);
              if (!table) return null;
              
              const windowState = getTableWindowState(tableId);
              const tableWindowKey = `table-${tableId}`;
              
              return (
                <TableWindow
                  key={tableId}
                  table={table}
                  allTables={appState.tables}
                  position={windowState.position}
                  size={windowState.size}
                  onClose={() => closeTableWindow(tableId)}
                  onPositionChange={(position) => updateTableWindowPosition(tableId, position)}
                  onSizeChange={(size) => updateTableWindowSize(tableId, size)}
                  onBringToFront={() => bringWindowToFront(tableWindowKey)}
                  zIndex={windowZIndices[tableWindowKey] || 6}
                />
              );
            })}
          </div>
        ) : (
          /* Normal Mode */
          <div className="welcome-section">
          {/* Welcome and Setup - Only when no vault is selected and welcome is visible */}
          {!appState.vaultPath && showWelcome && (
            <div className="window-container">
              <div className="window-header">
                <span className="window-title">{t.welcome.title}</span>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="window-close-button"
                  title={t.header.tooltips.closeWelcome}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="window-content">
                <div className="welcome-window-content">
                  <p className="welcome-description">
                  {(() => {
                    const parts =
                      t.welcome.description.split("{perchanceLink}");
                    return (
                      <>
                        {parts[0]}
                        <a
                          href="https://perchance.org/tutorial"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="perchance-link"
                        >
                          Perchance syntax
                        </a>
                        {parts[1] || ""}
                      </>
                    );
                  })()}
                </p>
                <div className="table-format-info">
                  <p className="format-description">
                    {t.welcome.tableInstructions}
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
                      {t.welcome.bracketInstructions}
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
                  {(() => {
                    let text = t.welcome.credits;

                    // Replace Script Wizards link
                    const scriptWizardsParts = text.split(
                      "{scriptWizardsLink}"
                    );
                    const beforeScriptWizards = scriptWizardsParts[0];
                    const afterScriptWizards = scriptWizardsParts[1] || "";

                    // Replace GitHub link in the remaining text
                    const githubParts =
                      afterScriptWizards.split("{githubLink}");
                    const betweenLinks = githubParts[0];
                    const afterGithub = githubParts[1] || "";

                    return (
                      <>
                        {beforeScriptWizards}
                        <a
                          href="https://scriptwizards.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="scriptwizards-text-link"
                        >
                          Script Wizards
                        </a>
                        {betweenLinks}
                        <a
                          href="https://github.com/script-wizards/oracle"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="github-text-link"
                        >
                          GitHub
                        </a>
                        {afterGithub}
                      </>
                    );
                  })()}
                </p>
                <p className="setup-instruction">
                  {t.welcome.setupInstruction}{" "}
                  <button
                    onClick={handleSelectVault}
                    disabled={
                      isSelectingVault || !FileService.isElectronAPIAvailable()
                    }
                    className="inline-vault-button"
                    title={t.tooltips.selectVaultFolder}
                  >
                    {isSelectingVault ? "..." : t.welcome.obsidianVault}
                  </button>{" "}
                  {t.welcome.letsRoll}
                </p>
                </div>
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
            <div className="main-content-layout">
              {/* Main content area */}
              <div className="main-content">
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
                    onTableOpen={openTableWindow}
                    searchQuery={searchQuery}
                    isKeyboardNavigating={keyboardNav.isNavigating}
                    rollResult={lastRollResult || undefined}
                    lastRolledTable={lastRolledTable || undefined}
                  />
                </div>
              </div>

              {/* Roll History - Sidebar on large screens, above content on small screens */}
              {showHistory && rollHistory.length > 0 && (
                <div className="history-container">
                  <div className="history-header">
                    <span className="history-title">{t.history.title}</span>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="history-close-button"
                      title={t.history.hideHistory}
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
            </div>
          </div>
        </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="copyright">© SCRIPT WIZARDS</div>
      </footer>
    </div>
  );
};

export default App;
