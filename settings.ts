export interface KindleSyncSettings {
    amazonCookies: string;
    targetFolder: string;
    syncInterval: number;
    selectedNotebooks: string[];
    autoSync: boolean;
    syncOnStartup: boolean;
    imageQuality: 'high' | 'medium' | 'low';
    markdownConversion: boolean;
    bidirectionalSync: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    notebookFolder: string;
    convertHandwriting: boolean;
    syncFolder: string;
}

export const DEFAULT_SETTINGS: KindleSyncSettings = {
    amazonCookies: '',
    targetFolder: 'Kindle Notes',
    syncInterval: 3600,
    selectedNotebooks: [],
    autoSync: true,
    syncOnStartup: true,
    imageQuality: 'high',
    markdownConversion: true,
    bidirectionalSync: true,
    logLevel: 'info',
    notebookFolder: 'Kindle Notebooks',
    convertHandwriting: true,
    syncFolder: 'Kindle Notes'
}; 