import { App, Modal, Setting, Notice } from 'obsidian';
import KindleSyncPlugin from './main';

export class KindleSyncModal extends Modal {
    plugin: KindleSyncPlugin;
    isSyncing: boolean = false;

    constructor(app: App, plugin: KindleSyncPlugin) {
        super(app);
        this.plugin = plugin;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Kindle Scribe Sync' });

        // Add sync button
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Sync Now')
                .setCta()
                .onClick(async () => {
                    if (this.isSyncing) {
                        new Notice('Sync already in progress');
                        return;
                    }
                    this.isSyncing = true;
                    new Notice('Starting sync...');
                    try {
                        await this.plugin.syncService.sync();
                        new Notice('Sync completed successfully');
                    } catch (error) {
                        new Notice('Sync failed: ' + (error as Error).message);
                    } finally {
                        this.isSyncing = false;
                    }
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
} 