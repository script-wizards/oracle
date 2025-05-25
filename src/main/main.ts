import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { WindowConfig, AppInfo, IPC_CHANNELS } from '../shared/types';

// Check if running in development mode
const isDev = process.argv.includes('--dev');

class MainApp {
    private mainWindow: BrowserWindow | null = null;

    private readonly windowConfig: WindowConfig = {
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        title: 'Random Table Roller'
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

        // Security: Prevent new window creation
        app.on('web-contents-created', (_, contents) => {
            contents.setWindowOpenHandler(() => {
                return { action: 'deny' };
            });
        });
    }

    private createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: this.windowConfig.width,
            height: this.windowConfig.height,
            minWidth: this.windowConfig.minWidth,
            minHeight: this.windowConfig.minHeight,
            title: this.windowConfig.title,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
            },
            show: false, // Don't show until ready
            titleBarStyle: 'default',
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
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    private setupIpcHandlers(): void {
        // Handle app info requests
        ipcMain.handle(IPC_CHANNELS.GET_APP_INFO, (): AppInfo => {
            return {
                name: app.getName(),
                version: app.getVersion(),
                isDev,
            };
        });

        // Handle window controls
        ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
            this.mainWindow?.minimize();
        });

        ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
            if (this.mainWindow?.isMaximized()) {
                this.mainWindow.unmaximize();
            } else {
                this.mainWindow?.maximize();
            }
        });

        ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
            this.mainWindow?.close();
        });
    }
}

// Initialize the application
new MainApp();
