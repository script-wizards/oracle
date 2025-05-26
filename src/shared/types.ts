// Shared types between main and renderer processes

export interface WindowConfig {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    title: string;
}

export interface AppInfo {
    name: string;
    version: string;
    isDev: boolean;
}

// IPC channel names
export const IPC_CHANNELS = {
    GET_APP_INFO: 'get-app-info',
    // File system operations
    SELECT_VAULT_FOLDER: 'select-vault-folder',
    SCAN_VAULT_FILES: 'scan-vault-files',
    READ_FILE_CONTENT: 'read-file-content',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

// ============================================================================
// Oracle Application Types
// ============================================================================

/**
 * Represents a parsed table section from Perchance syntax
 */
export interface TableSection {
    /** The name/identifier of the table section */
    name: string;
    /** The entries in this table section */
    entries: string[];
}

/**
 * Represents a parsed random table with all its metadata and content
 */
export interface Table {
    /** Unique identifier for the table */
    id: string;
    /** Display title of the table */
    title: string;
    /** Array of table entries/outcomes (for backward compatibility) */
    entries: string[];
    /** Parsed sections from the Perchance table */
    sections?: TableSection[];
    /** Names of subtables referenced by this table */
    subtables: string[];
    /** File path where this table was found */
    filePath: string;
    /** Index of the code block within the file (0-based) */
    codeBlockIndex: number;
    /** Optional array of parsing or validation errors */
    errors?: string[];
}

/**
 * Represents the result of rolling on a table
 */
export interface RollResult {
    /** Final resolved text after all substitutions */
    text: string;
    /** Array of individual subtable resolutions that occurred */
    subrolls: SubrollData[];
    /** Optional array of errors that occurred during rolling */
    errors?: string[];
}

/**
 * Represents individual subtable resolutions within a roll result
 */
export interface SubrollData {
    /** The resolved text from this subroll */
    text: string;
    /** Type of resolution that occurred */
    type: 'dice' | 'subtable';
    /** Optional source table name for subtable rolls */
    source?: string;
    /** Start index in the original text for highlighting */
    startIndex: number;
    /** End index in the original text for highlighting */
    endIndex: number;
    /** The original entry text that was selected (before resolution) */
    originalEntry?: string;
    /** The index of the entry that was selected from the source section */
    entryIndex?: number;
    /** Whether this subroll contains nested references (used for rendering) */
    hasNestedRefs?: boolean;
}

/**
 * Represents the application's global state
 */
export interface AppState {
    /** Path to the vault/directory containing tables */
    vaultPath?: string;
    /** Array of all loaded tables */
    tables: Table[];
    /** Current search query for filtering tables */
    searchQuery: string;
    /** Index of the currently selected table (-1 if none) */
    selectedTableIndex: number;
    /** Timestamp of the last vault scan */
    lastScanTime?: Date;
}

/**
 * Represents raw parsed code blocks from markdown files
 */
export interface ParsedCodeBlock {
    /** Raw content of the code block */
    content: string;
    /** Starting line number in the file (1-based) */
    startLine: number;
    /** Ending line number in the file (1-based) */
    endLine: number;
    /** File path where this code block was found */
    filePath: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Represents the status of an async operation
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic error type for application errors
 */
export interface AppError {
    message: string;
    code?: string;
    details?: unknown;
}

/**
 * Configuration for table parsing
 */
export interface ParseConfig {
    /** Whether to include tables with errors */
    includeErrorTables: boolean;
    /** Maximum number of entries per table */
    maxEntries: number;
    /** File extensions to scan for tables */
    allowedExtensions: string[];
}
