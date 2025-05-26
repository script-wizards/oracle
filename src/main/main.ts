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
        minWidth: 600,
        minHeight: 400,
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
        console.log('Preload path:', preloadPath);
        console.log('Preload file exists:', require('fs').existsSync(preloadPath));

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
            show: false, // Don't show until ready
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
            titleBarOverlay: process.platform !== 'darwin' ? {
                color: '#2a2a2a',
                symbolColor: '#e0e0e0',
                height: 40
            } : undefined,
            trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 12 } : undefined,
        });

        // Load the app
        if (isDev) {
            // Development: load from Vite dev server
            this.mainWindow.loadURL('http://localhost:3000');
            // Open DevTools in development
            this.mainWindow.webContents.openDevTools();
        } else {
            // Production: load from built files
            this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
        }

        // Show window when ready to prevent visual flash
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();

            // Ensure traffic lights are visible on macOS
            if (process.platform === 'darwin') {
                this.mainWindow?.setWindowButtonVisibility(true);
            }
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    private async scanForMarkdownFiles(dirPath: string): Promise<string[]> {
        console.log('Starting scan for markdown files in:', dirPath);
        const mdFiles: string[] = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            console.log(`Found ${entries.length} entries in directory:`, dirPath);

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Skip hidden directories and common non-content directories
                    if (!entry.name.startsWith('.') &&
                        !['node_modules', '.git', '.obsidian'].includes(entry.name)) {
                        console.log('Scanning subdirectory:', entry.name);
                        const subFiles = await this.scanForMarkdownFiles(fullPath);
                        mdFiles.push(...subFiles);
                    } else {
                        console.log('Skipping directory:', entry.name);
                    }
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    console.log('Found markdown file:', entry.name);
                    mdFiles.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
            // Don't throw here, just skip this directory
        }

        console.log(`Scan complete. Found ${mdFiles.length} markdown files total.`);
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
                const content = await fs.readFile(filePath, 'utf-8');
                return content;
            } catch (error) {
                console.error('Error reading file content:', error);
                throw new Error(`Failed to read file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
}

// Initialize the application
new MainApp();
