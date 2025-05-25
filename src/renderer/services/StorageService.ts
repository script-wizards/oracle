import { AppState, Table } from '../../shared/types';

/**
 * Storage keys used in localStorage
 */
const STORAGE_KEYS = {
    APP_STATE: 'random-table-roller-app-state',
    VAULT_PATH: 'random-table-roller-vault-path',
} as const;

/**
 * Creates a default AppState with sensible defaults
 */
export function createDefaultAppState(): AppState {
    return {
        vaultPath: undefined,
        tables: [],
        searchQuery: '',
        selectedTableIndex: -1,
        lastScanTime: undefined,
    };
}

/**
 * Validates that a loaded object matches the AppState interface structure
 */
function validateAppState(obj: any): obj is AppState {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    // Check required properties exist and have correct types
    const hasValidTables = Array.isArray(obj.tables);
    const hasValidSearchQuery = typeof obj.searchQuery === 'string';
    const hasValidSelectedIndex = typeof obj.selectedTableIndex === 'number';

    // Optional properties validation
    const hasValidVaultPath = obj.vaultPath === undefined || typeof obj.vaultPath === 'string';
    const hasValidLastScanTime = obj.lastScanTime === undefined ||
        obj.lastScanTime instanceof Date ||
        typeof obj.lastScanTime === 'string'; // Date might be serialized as string

    return hasValidTables &&
        hasValidSearchQuery &&
        hasValidSelectedIndex &&
        hasValidVaultPath &&
        hasValidLastScanTime;
}

/**
 * Validates that a table object matches the Table interface
 */
function validateTable(obj: any): obj is Table {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        Array.isArray(obj.entries) &&
        Array.isArray(obj.subtables) &&
        typeof obj.filePath === 'string' &&
        typeof obj.codeBlockIndex === 'number' &&
        (obj.errors === undefined || Array.isArray(obj.errors));
}

/**
 * Service class for managing localStorage operations
 */
export class StorageService {
    /**
     * Saves the complete application state to localStorage
     */
    static async saveAppState(state: AppState): Promise<void> {
        try {
            // Create a serializable version of the state
            const serializableState = {
                ...state,
                lastScanTime: state.lastScanTime?.toISOString(),
            };

            const serialized = JSON.stringify(serializableState);
            localStorage.setItem(STORAGE_KEYS.APP_STATE, serialized);

            console.log('App state saved successfully');
        } catch (error) {
            console.error('Failed to save app state:', error);
            throw new Error(`Failed to save app state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Loads the application state from localStorage
     */
    static async loadAppState(): Promise<AppState | null> {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.APP_STATE);

            if (!stored) {
                console.log('No stored app state found');
                return null;
            }

            const parsed = JSON.parse(stored);

            // Validate the loaded state
            if (!validateAppState(parsed)) {
                console.warn('Stored app state is invalid, returning null');
                return null;
            }

            // Validate all tables in the state
            if (parsed.tables && Array.isArray(parsed.tables)) {
                if (!parsed.tables.every(validateTable)) {
                    console.warn('Some tables in stored state are invalid, filtering them out');
                    parsed.tables = (parsed.tables as any[]).filter(validateTable);
                }
            }

            // Convert lastScanTime back to Date if it exists
            if (parsed.lastScanTime) {
                parsed.lastScanTime = new Date(parsed.lastScanTime);
            }

            console.log('App state loaded successfully');
            return parsed as AppState;
        } catch (error) {
            console.error('Failed to load app state:', error);
            // Don't throw here, just return null to use default state
            return null;
        }
    }

    /**
     * Clears all stored application state
     */
    static async clearAppState(): Promise<void> {
        try {
            localStorage.removeItem(STORAGE_KEYS.APP_STATE);
            localStorage.removeItem(STORAGE_KEYS.VAULT_PATH);
            console.log('App state cleared successfully');
        } catch (error) {
            console.error('Failed to clear app state:', error);
            throw new Error(`Failed to clear app state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets the stored vault path
     */
    static async getVaultPath(): Promise<string | null> {
        try {
            const path = localStorage.getItem(STORAGE_KEYS.VAULT_PATH);
            return path;
        } catch (error) {
            console.error('Failed to get vault path:', error);
            return null;
        }
    }

    /**
     * Saves the vault path to localStorage
     */
    static async setVaultPath(path: string): Promise<void> {
        try {
            localStorage.setItem(STORAGE_KEYS.VAULT_PATH, path);
            console.log('Vault path saved successfully:', path);
        } catch (error) {
            console.error('Failed to save vault path:', error);
            throw new Error(`Failed to save vault path: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets storage usage information
     */
    static getStorageInfo(): { used: number; available: number } {
        try {
            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length;
                }
            }

            // Most browsers have a 5-10MB limit for localStorage
            const available = 5 * 1024 * 1024; // Assume 5MB limit

            return { used, available };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return { used: 0, available: 0 };
        }
    }

    /**
     * Checks if localStorage is available and working
     */
    static isStorageAvailable(): boolean {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage is not available:', error);
            return false;
        }
    }
}
