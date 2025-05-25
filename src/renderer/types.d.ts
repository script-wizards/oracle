// Type declarations for the renderer process

import { ElectronAPI } from '../main/preload';

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
