import { TFile, Plugin, App, Notice } from 'obsidian';
import KindleSyncPlugin from '../main';
import { AmazonKindleAPI } from './amazonKindleAPI';
import { TextRecognitionService } from './textRecognitionService';
import { ImageProcessingService } from './imageProcessingService';
import { MarkdownConverter } from './markdownConverter';
import { KindleSyncSettings } from '../settings';
import { NotebookConverter } from './notebookConverter';
import * as fs from 'fs';
import * as path from 'path';
import { KindleNotebook, NotebookMetadata } from '../types';

interface Notebook {
    id: string;
    name: string;
    lastModified: string;
}

export class KindleSyncService {
    private plugin: KindleSyncPlugin;
    private apiService: AmazonKindleAPI;
    private textRecognition: TextRecognitionService;
    private imageProcessing: ImageProcessingService;
    private markdownConverter: MarkdownConverter;
    private syncInterval: NodeJS.Timeout | null = null;
    private app: App;
    private settings: KindleSyncSettings;
    private syncInProgress: boolean = false;
    private amazonAPI: AmazonKindleAPI;

    constructor(
        app: App,
        plugin: KindleSyncPlugin
    ) {
        this.plugin = plugin;
        this.app = app;
        this.settings = plugin.settings;
        this.apiService = new AmazonKindleAPI(this.settings);
        this.textRecognition = new TextRecognitionService();
        this.imageProcessing = new ImageProcessingService();
        this.markdownConverter = new MarkdownConverter();
        this.amazonAPI = new AmazonKindleAPI({
            amazonCookies: plugin.settings.amazonCookies,
            targetFolder: plugin.settings.targetFolder,
            syncInterval: plugin.settings.syncInterval,
            selectedNotebooks: plugin.settings.selectedNotebooks,
            autoSync: plugin.settings.autoSync,
            syncOnStartup: plugin.settings.syncOnStartup,
            imageQuality: plugin.settings.imageQuality,
            markdownConversion: plugin.settings.markdownConversion,
            bidirectionalSync: plugin.settings.bidirectionalSync,
            logLevel: plugin.settings.logLevel,
            notebookFolder: plugin.settings.notebookFolder,
            convertHandwriting: plugin.settings.convertHandwriting,
            syncFolder: plugin.settings.syncFolder
        });
    }

    private async handleTokenRefresh(newCookies: string): Promise<void> {
        this.plugin.settings.amazonCookies = newCookies;
        await this.plugin.saveSettings();
        console.log('Cookies refreshed successfully');
    }

    async testConnection(): Promise<void> {
        try {
            await this.apiService.testConnection();
        } catch (error) {
            throw new Error('Connection test failed: ' + (error as Error).message);
        }
    }

    async sync(): Promise<void> {
        if (this.syncInProgress) {
            throw new Error('Sync already in progress');
        }

        this.syncInProgress = true;
        try {
            // Validate token first
            await this.apiService.testConnection();
            
            // Get notebooks
            const notebooks = await this.apiService.getNotebooks();
            
            // Ensure the target directory exists
            await this.ensureDirectoryExists(this.settings.targetFolder);
            
            // Process each notebook
            for (const notebook of notebooks) {
                if (this.plugin.settings.selectedNotebooks.length === 0 || 
                    this.plugin.settings.selectedNotebooks.includes(notebook.id)) {
                    await this.processNotebook(notebook);
                    break
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
            throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            this.syncInProgress = false;
        }
    }

    private async processNotebook(notebook: KindleNotebook): Promise<void> {
        try {
            // Get notebook content
            const content = await this.apiService.getNotebookContent(notebook.id);
            console.log(`Got content for notebook ${notebook.name}`);

            // Convert to markdown
            const markdown = await NotebookConverter.processTarToMarkdown(content);
            console.log(`Converted notebook ${notebook.name} to markdown`);

            // Create file path
            const fileName = `${notebook.name}.md`;
            const filePath = `${this.settings.targetFolder}/${fileName}`;

            // Check if file exists
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                // Update existing file
                await this.app.vault.modify(existingFile, markdown);
                console.log(`Updated existing notebook ${notebook.name} at ${filePath}`);
            } else {
                // Create new file
                await this.app.vault.create(filePath, markdown);
                console.log(`Created new notebook ${notebook.name} at ${filePath}`);
            }

            new Notice(`Synced notebook: ${notebook.name}`);
        } catch (error) {
            console.error(`Failed to sync notebook ${notebook.name}:`, error);
            new Notice(`Failed to sync notebook ${notebook.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async createOrUpdateNote(notebookName: string, pageNumber: number, markdown: string): Promise<void> {
        const fileName = `${notebookName} - Page ${pageNumber}.md`;
        const folderPath = this.plugin.settings.notebookFolder;
        // Ensure folder exists
        const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
            await this.plugin.app.vault.createFolder(folderPath);
        }
        const filePath = `${folderPath}/${fileName}`;
        const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
        try {
            if (file && file instanceof TFile) {
                await this.plugin.app.vault.modify(file, markdown);
            } else {
                await this.plugin.app.vault.create(filePath, markdown);
            }
        } catch (error) {
            throw new Error(`Failed to create/update note ${fileName}: ${(error as Error).message}`);
        }
    }

    async startSync(intervalMinutes: number = 30): Promise<void> {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Initial sync
        await this.sync();

        // Set up periodic sync
        this.syncInterval = setInterval(() => {
            this.sync();
        }, intervalMinutes * 60 * 1000);
    }

    stopSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    cleanup(): void {
        this.stopSync();
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            // Check if the folder exists
            const folder = this.app.vault.getAbstractFileByPath(dirPath);
            if (!folder) {
                // Create the folder using Obsidian's vault API
                await this.app.vault.createFolder(dirPath);
            }
        } catch (error) {
            console.error('Error creating directory:', error);
            throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async syncNotebook(notebook: KindleNotebook): Promise<void> {
        try {
            // Get the notebook content from Amazon
            const amazonContent = await this.amazonAPI.getNotebookContent(notebook.id);
            
            // Convert notebook content to markdown
            const markdownContent = this.convertNotebookToMarkdown(amazonContent);
            
            // Get the local file content
            const localFilePath = this.getLocalFilePath(notebook.name);
            const localFile = this.app.vault.getAbstractFileByPath(localFilePath);
            
            if (!localFile) {
                // Create new file if it doesn't exist
                await this.app.vault.create(localFilePath, markdownContent);
                console.log(`Created new file for notebook: ${notebook.name}`);
            } else if (localFile instanceof TFile) {
                // Compare content and update if different
                const localContent = await this.app.vault.read(localFile);
                if (localContent !== markdownContent) {
                    await this.app.vault.modify(localFile, markdownContent);
                    console.log(`Updated content for notebook: ${notebook.name}`);
                }
            }
        } catch (error) {
            console.error(`Error syncing notebook ${notebook.name}:`, error);
            throw error;
        }
    }

    private convertNotebookToMarkdown(notebookContent: { metadata: NotebookMetadata; pages: Buffer[] }): string {
        // Convert notebook content to markdown format
        let markdown = `# ${notebookContent.metadata.title}\n\n`;
        
        // Add metadata
        markdown += `Current Page: ${notebookContent.metadata.currentPage}\n`;
        markdown += `Total Pages: ${notebookContent.metadata.totalPages}\n`;
        markdown += `Last Modified: ${new Date(notebookContent.metadata.modificationTime).toLocaleString()}\n\n`;
        
        // Add notebook content
        notebookContent.pages.forEach((page, index) => {
            markdown += `## Page ${index + 1}\n\n`;
            markdown += page.toString('utf-8') + '\n\n';
        });
        
        return markdown;
    }

    private getLocalFilePath(notebookName: string): string {
        const sanitizedName = notebookName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return `${this.plugin.settings.syncFolder}/${sanitizedName}.md`;
    }
} 