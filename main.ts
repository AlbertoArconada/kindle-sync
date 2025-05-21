import { App, Plugin, PluginSettingTab, WorkspaceLeaf, Notice } from 'obsidian';
import { KindleSyncSettings, DEFAULT_SETTINGS } from './settings';
import { KindleSyncSettingTab } from './settingsTab';
import { KindleSyncService } from './services/syncService';
import { KindleSyncStatusBar } from './statusBar';
import { KindleSyncView } from './view';

export default class KindleSyncPlugin extends Plugin {
    settings!: KindleSyncSettings;
    statusBar!: KindleSyncStatusBar;
    syncService!: KindleSyncService;
    syncView!: KindleSyncView;

    async onload() {
        await this.loadSettings();
        
        this.statusBar = new KindleSyncStatusBar(this);
        this.syncService = new KindleSyncService(this.app, this);
        this.syncView = new KindleSyncView(this);
        
        this.addSettingTab(new KindleSyncSettingTab(this.app, this));
        
        this.addRibbonIcon('book-open', 'Kindle Sync', async () => {
            try {
                await this.syncService.sync();
                new Notice('Kindle sync completed successfully');
            } catch (error) {
                new Notice('Kindle sync failed: ' + (error as Error).message);
            }
        });
        
        this.addCommand({
            id: 'sync-kindle',
            name: 'Sync Kindle Notebooks',
            callback: async () => {
                try {
                    await this.syncService.sync();
                    new Notice('Kindle sync completed successfully');
                } catch (error) {
                    new Notice('Kindle sync failed: ' + (error as Error).message);
                }
            }
        });
        
        this.addCommand({
            id: 'show-sync-status',
            name: 'Show Sync Status',
            callback: async () => {
                let leaf = this.app.workspace.getLeavesOfType('kindle-sync-view')[0];
                if (!leaf) {
                    const newLeaf = this.app.workspace.getRightLeaf(false);
                    if (!newLeaf) {
                        new Notice('Could not create sync status view');
                        return;
                    }
                    leaf = newLeaf;
                    await leaf.setViewState({ type: 'kindle-sync-view', active: true });
                }
                this.app.workspace.revealLeaf(leaf);
            }
        });
        
        this.registerView('kindle-sync-view', (leaf: WorkspaceLeaf) => this.syncView);

        if (this.settings.autoSync) {
            this.syncService.startSync();
        }
    }

    onunload() {
        this.syncService.cleanup();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
} 