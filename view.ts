import { ItemView, WorkspaceLeaf } from 'obsidian';
import KindleSyncPlugin from './main';

export class KindleSyncView extends ItemView {
    private plugin: KindleSyncPlugin;
    private statusEl!: HTMLElement;
    private logsEl!: HTMLElement;
    private syncButtonEl!: HTMLButtonElement;
    private lastSyncEl!: HTMLElement;

    constructor(plugin: KindleSyncPlugin) {
        super(plugin.app.workspace.getLeavesOfType('kindle-sync-view')[0] || plugin.app.workspace.getRightLeaf(false));
        this.plugin = plugin;
    }

    getViewType(): string {
        return 'kindle-sync-view';
    }

    getDisplayText(): string {
        return 'Kindle Sync Status';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('kindle-sync-view');

        // Header section
        const headerSection = container.createDiv('kindle-sync-header');
        headerSection.createEl('h2', { text: 'Kindle Sync Status' });

        // Status section
        const statusSection = container.createDiv('kindle-sync-status-section');
        this.statusEl = statusSection.createDiv('kindle-sync-status');
        this.statusEl.setText('Ready to sync');

        // Last sync section
        const lastSyncSection = container.createDiv('kindle-sync-last-sync');
        lastSyncSection.createEl('span', { text: 'Last sync: ' });
        this.lastSyncEl = lastSyncSection.createEl('span', { text: 'Never' });

        // Sync button
        this.syncButtonEl = statusSection.createEl('button', { 
            text: 'Sync Now',
            cls: 'kindle-sync-button'
        }) as HTMLButtonElement;
        this.syncButtonEl.addEventListener('click', () => this.startSync());

        // Auto-sync toggle
        const autoSyncSection = container.createDiv('kindle-sync-auto-sync');
        autoSyncSection.createEl('span', { text: 'Auto-sync: ' });
        const autoSyncToggle = autoSyncSection.createEl('input', {
            type: 'checkbox',
            cls: 'kindle-sync-toggle'
        }) as HTMLInputElement;
        autoSyncToggle.checked = this.plugin.settings.autoSync;
        autoSyncToggle.addEventListener('change', (e) => {
            this.plugin.settings.autoSync = (e.target as HTMLInputElement).checked;
            this.plugin.saveSettings();
            if (this.plugin.settings.autoSync) {
                this.plugin.syncService.startSync();
            } else {
                this.plugin.syncService.stopSync();
            }
        });

        // Debug section
        const debugSection = container.createDiv('kindle-sync-debug-section');
        debugSection.createEl('h3', { text: 'Debug Information' });
        
        const debugInfo = debugSection.createDiv('kindle-sync-debug-info');
        debugInfo.createEl('p', { text: 'To see detailed logs:' });
        debugInfo.createEl('ol', { text: '' }).innerHTML = `
            <li>Open Developer Tools (Help > Toggle Developer Tools)</li>
            <li>Go to the Console tab</li>
            <li>Try syncing or testing the connection</li>
            <li>Look for logs starting with "Testing connection..."</li>
        `;

        // Logs section
        const logsSection = container.createDiv('kindle-sync-logs-section');
        logsSection.createEl('h3', { text: 'Recent Logs' });
        this.logsEl = logsSection.createDiv('kindle-sync-logs');

        // Add initial log
        this.addLog('System initialized');
        this.addLog('Ready to sync');
    }

    async onClose(): Promise<void> {
        this.syncButtonEl.removeEventListener('click', () => {});
    }

    updateStatus(status: string): void {
        this.statusEl.setText(status);
    }

    updateLastSync(date: Date): void {
        this.lastSyncEl.setText(date.toLocaleString());
    }

    addLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const logEntry = this.logsEl.createDiv('kindle-sync-log-entry');
        logEntry.addClass(`kindle-sync-log-${level}`);
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.createEl('span', { 
            text: `[${timestamp}] `,
            cls: 'kindle-sync-log-timestamp'
        });
        
        logEntry.createEl('span', { 
            text: message,
            cls: 'kindle-sync-log-message'
        });

        // Auto-scroll to bottom
        this.logsEl.scrollTop = this.logsEl.scrollHeight;
    }

    private async startSync(): Promise<void> {
        this.syncButtonEl.disabled = true;
        this.updateStatus('Syncing...');
        this.addLog('Starting sync process');

        try {
            await this.plugin.syncService.sync();
            this.updateStatus('Sync completed');
            this.updateLastSync(new Date());
            this.addLog('Sync completed successfully');
        } catch (error) {
            this.updateStatus('Sync failed');
            this.addLog(`Sync failed: ${(error as Error).message}`, 'error');
        } finally {
            this.syncButtonEl.disabled = false;
        }
    }
} 