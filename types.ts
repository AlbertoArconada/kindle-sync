export interface NotebookMetadata {
    currentPage: number;
    modificationTime: number;
    title: string;
    totalPages: number;
    created?: string;
    lastModified?: string;
}

export interface KindleNotebook {
    id: string;
    name: string;
    lastModified: string;
    metadata?: NotebookMetadata;
    pages?: Buffer[];
    path?: string;
}

export interface KindleSyncSettings {
    amazonCookies: string;
    syncFolder: string;
    syncInterval: number;
    lastSyncTime?: string;
} 