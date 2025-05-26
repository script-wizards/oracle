import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script starting...');

// Define IPC channels directly to avoid import issues
const IPC_CHANNELS = {
    GET_APP_INFO: 'get-app-info',
    // File system operations
    SELECT_VAULT_FOLDER: 'select-vault-folder',
    SCAN_VAULT_FILES: 'scan-vault-files',
    READ_FILE_CONTENT: 'read-file-content',
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppInfo: (): Promise<any> => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_INFO),

    // File system operations
    selectVaultFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.SELECT_VAULT_FOLDER),
    scanVaultFiles: (vaultPath: string): Promise<string[]> => ipcRenderer.invoke(IPC_CHANNELS.SCAN_VAULT_FILES, vaultPath),
    readFileContent: (filePath: string): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.READ_FILE_CONTENT, filePath),
});

console.log('Preload script completed. electronAPI should be exposed.');

// Type definitions for the exposed API
export interface ElectronAPI {
    getAppInfo: () => Promise<any>;
    // File system operations
    selectVaultFolder: () => Promise<string | null>;
    scanVaultFiles: (vaultPath: string) => Promise<string[]>;
    readFileContent: (filePath: string) => Promise<string>;
}

// Extend the Window interface to include our API
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
