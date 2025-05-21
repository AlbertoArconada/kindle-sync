import { App } from 'obsidian';
import KindleSyncPlugin from './main';

export class KindleSyncStatusBar {
    private statusBarItem: HTMLElement;
    private plugin: KindleSyncPlugin;

    constructor(plugin: KindleSyncPlugin) {
        this.plugin = plugin;
        this.statusBarItem = this.plugin.addStatusBarItem();
        this.statusBarItem.setText('Kindle Sync: Ready');
    }

    updateStatus(status: string): void {
        this.statusBarItem.setText(`Kindle Sync: ${status}`);
    }

    showError(message: string): void {
        this.statusBarItem.setText(`Kindle Sync: Error - ${message}`);
        this.statusBarItem.addClass('error');
        setTimeout(() => {
            this.statusBarItem.removeClass('error');
            this.updateStatus('Ready');
        }, 5000);
    }

    setSyncing() {
        this.statusBarItem.setText('Kindle Sync: Syncing...');
        this.statusBarItem.addClass('kindle-sync-syncing');
    }

    clearSyncing() {
        this.statusBarItem.removeClass('kindle-sync-syncing');
    }
} 