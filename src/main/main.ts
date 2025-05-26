import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { WindowConfig, AppInfo, IPC_CHANNELS } from '../shared/types';
import * as packageJson from '../../package.json';

// Check if running in development mode
const isDev = process.argv.includes('--dev');

class MainApp {
    private mainWindow: BrowserWindow | null = null;

    private readonly windowConfig: WindowConfig = {
        width: 800,
        height: 600,
        minWidth: 300,
        minHeight: 200,
        title: 'Oracle'
    };

    constructor() {
        this.initializeApp();
    }

    private initializeApp(): void {
        // Handle app ready
        app.whenReady().then(() => {
            this.createMainWindow();
            this.setupIpcHandlers();

            // On macOS, re-create window when dock icon is clicked
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });

        // Quit when all windows are closed (except on macOS)
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        // Security: Handle external links and prevent unauthorized window creation
        app.on('web-contents-created', (_, contents) => {
            // Handle external links
            contents.setWindowOpenHandler(({ url }) => {
                // Allow external links to open in default browser
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    shell.openExternal(url);
                }
                // Deny all window creation (external links are handled above)
                return { action: 'deny' };
            });

            // Also handle navigation to external URLs
            contents.on('will-navigate', (event, navigationUrl) => {
                const parsedUrl = new URL(navigationUrl);

                // Allow navigation within the app (localhost for dev, file:// for production)
                if (parsedUrl.protocol === 'file:' ||
                    (isDev && parsedUrl.hostname === 'localhost')) {
                    return;
                }

                // For external URLs, prevent navigation and open in external browser
                event.preventDefault();
                shell.openExternal(navigationUrl);
            });
        });
    }

    private createMainWindow(): void {
        const preloadPath = path.join(__dirname, 'preload.js');

        this.mainWindow = new BrowserWindow({
            width: this.windowConfig.width,
            height: this.windowConfig.height,
            minWidth: this.windowConfig.minWidth,
            minHeight: this.windowConfig.minHeight,
            title: this.windowConfig.title,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: preloadPath,
            },
            show: true, // Show immediately for debugging
            // Simplify titleBar settings for Windows to avoid issues
            ...(process.platform === 'darwin' ? {
                titleBarStyle: 'hiddenInset',
                trafficLightPosition: { x: 16, y: 12 }
            } : {
                // For Windows, use default titleBar to avoid potential issues
                frame: true
            })
        });

        // Add error handling for loading failures
        this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.error('Failed to load:', errorCode, errorDescription, validatedURL);
            // Show window anyway so user can see what's happening
            this.mainWindow?.show();
        });

        // Add more event listeners for debugging
        this.mainWindow.webContents.on('did-finish-load', () => {
            this.mainWindow?.show();
        });

        this.mainWindow.webContents.on('dom-ready', () => {
            this.mainWindow?.show();
        });

        // Load the app
        if (isDev) {
            // Development: load from Vite dev server
            this.mainWindow.loadURL('http://localhost:3000');
            // Open DevTools in development
            this.mainWindow.webContents.openDevTools();
        } else {
            // Production: load from built files
            const htmlPath = path.join(__dirname, '../renderer/index.html');
            this.mainWindow.loadFile(htmlPath);
        }

        // Show window when ready to prevent visual flash
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
            this.mainWindow?.focus();

            // Ensure traffic lights are visible on macOS
            if (process.platform === 'darwin') {
                this.mainWindow?.setWindowButtonVisibility(true);
            }
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Force show after a short delay
        setTimeout(() => {
            this.mainWindow?.show();
            this.mainWindow?.focus();
        }, 1000);
    }

    private async scanForMarkdownFiles(dirPath: string): Promise<string[]> {
        const mdFiles: string[] = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Skip hidden directories and common non-content directories
                    if (!entry.name.startsWith('.') &&
                        !['node_modules', '.git', '.obsidian'].includes(entry.name)) {
                        try {
                            const subFiles = await this.scanForMarkdownFiles(fullPath);
                            mdFiles.push(...subFiles);
                        } catch (subDirError) {
                            console.error(`Error scanning subdirectory ${fullPath}:`, subDirError);
                            // Continue with other directories
                        }
                    }
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    // Validate file accessibility
                    try {
                        await fs.access(fullPath, fs.constants.R_OK);
                        mdFiles.push(fullPath);
                    } catch (accessError) {
                        console.error(`Cannot access file ${fullPath}:`, accessError);
                        // Continue with other files
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
            // Don't throw here, just skip this directory
        }

        return mdFiles;
    }

    private setupIpcHandlers(): void {
        // Handle app info requests
        ipcMain.handle(IPC_CHANNELS.GET_APP_INFO, (): AppInfo => {
            return {
                name: packageJson.name,
                version: packageJson.version,
                isDev,
            };
        });



        // File system operations
        ipcMain.handle(IPC_CHANNELS.SELECT_VAULT_FOLDER, async (): Promise<string | null> => {
            if (!this.mainWindow) return null;

            try {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                    title: 'Select Obsidian Vault Folder',
                    properties: ['openDirectory'],
                    message: 'Choose the folder containing your Obsidian vault'
                });

                if (result.canceled || result.filePaths.length === 0) {
                    return null;
                }

                return result.filePaths[0];
            } catch (error) {
                console.error('Error selecting vault folder:', error);
                throw new Error(`Failed to select vault folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        ipcMain.handle(IPC_CHANNELS.SCAN_VAULT_FILES, async (_, vaultPath: string): Promise<string[]> => {
            try {
                const mdFiles = await this.scanForMarkdownFiles(vaultPath);
                return mdFiles;
            } catch (error) {
                console.error('Error scanning vault files:', error);
                throw new Error(`Failed to scan vault files: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        ipcMain.handle(IPC_CHANNELS.READ_FILE_CONTENT, async (_, filePath: string): Promise<string> => {
            try {
                // Validate file path
                if (!filePath || typeof filePath !== 'string') {
                    throw new Error('Invalid file path provided');
                }

                // Check if file exists and is accessible
                try {
                    await fs.access(filePath, fs.constants.R_OK);
                } catch (accessError) {
                    throw new Error(`File not accessible: ${accessError instanceof Error ? accessError.message : 'Unknown access error'}`);
                }

                // Try reading with UTF-8 first
                let content: string;
                try {
                    content = await fs.readFile(filePath, 'utf-8');
                } catch (encodingError) {
                    console.warn('UTF-8 reading failed, trying with latin1:', encodingError);
                    // Fallback to latin1 for files with different encoding
                    const buffer = await fs.readFile(filePath);
                    content = buffer.toString('latin1');
                }

                // Basic content validation
                if (content.length === 0) {
                    console.warn('File appears to be empty');
                }

                return content;
            } catch (error) {
                console.error('Error reading file content:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to read file content: ${errorMessage}`);
            }
        });
    }
}

// Initialize the application
new MainApp();
