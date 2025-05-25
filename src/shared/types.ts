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
    WINDOW_MINIMIZE: 'window-minimize',
    WINDOW_MAXIMIZE: 'window-maximize',
    WINDOW_CLOSE: 'window-close',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
