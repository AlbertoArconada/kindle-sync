import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import KindleSyncPlugin from './main';
import { KindleSyncSettings } from './settings';
import { AmazonKindleAPI } from './services/amazonKindleAPI';

export class KindleSyncSettingTab extends PluginSettingTab {
    private plugin: KindleSyncPlugin;

    constructor(app: App, plugin: KindleSyncPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Kindle Scribe Sync Settings' });

        new Setting(containerEl)
            .setName('Amazon Cookies')
            .setDesc('Enter your Amazon session cookies for authentication')
            .addText(text => text
                .setPlaceholder('Enter your cookies')
                .setValue(this.plugin.settings.amazonCookies)
                .onChange(async (value) => {
                    this.plugin.settings.amazonCookies = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Target Folder')
            .setDesc('The folder where your Kindle notes will be saved')
            .addText(text => text
                .setPlaceholder('Kindle Notes')
                .setValue(this.plugin.settings.targetFolder)
                .onChange(async (value) => {
                    this.plugin.settings.targetFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Sync Interval')
            .setDesc('How often to sync your notes (in seconds)')
            .addText(text => text
                .setPlaceholder('3600')
                .setValue(this.plugin.settings.syncInterval.toString())
                .onChange(async (value) => {
                    const interval = parseInt(value);
                    if (!isNaN(interval) && interval > 0) {
                        this.plugin.settings.syncInterval = interval;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Test Connection')
            .setDesc('Test your Amazon cookies')
            .addButton(button => button
                .setButtonText('Test')
                .onClick(async () => {
                    try {
                        const api = new AmazonKindleAPI(this.plugin.settings);
                        const success = await api.testConnection();
                        if (success) {
                            new Notice('Connection successful!');
                        } else {
                            new Notice('Connection failed. Please check your cookies.');
                        }
                    } catch (error) {
                        new Notice(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }));

        new Setting(containerEl)
            .setName('Auto Sync')
            .setDesc('Automatically sync notebooks at the specified interval')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoSync)
                .onChange(async (value) => {
                    this.plugin.settings.autoSync = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Sync on Startup')
            .setDesc('Sync notebooks when Obsidian starts')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.syncOnStartup)
                .onChange(async (value) => {
                    this.plugin.settings.syncOnStartup = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Image Quality')
            .setDesc('Quality of exported images')
            .addDropdown(dropdown => dropdown
                .addOption('high', 'High')
                .addOption('medium', 'Medium')
                .addOption('low', 'Low')
                .setValue(this.plugin.settings.imageQuality)
                .onChange(async (value) => {
                    this.plugin.settings.imageQuality = value as 'high' | 'medium' | 'low';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Markdown Conversion')
            .setDesc('Convert handwritten text to markdown')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.markdownConversion)
                .onChange(async (value) => {
                    this.plugin.settings.markdownConversion = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Bidirectional Sync')
            .setDesc('Sync changes from Obsidian back to Kindle')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.bidirectionalSync)
                .onChange(async (value) => {
                    this.plugin.settings.bidirectionalSync = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Log Level')
            .setDesc('Level of detail in logs')
            .addDropdown(dropdown => dropdown
                .addOption('debug', 'Debug')
                .addOption('info', 'Info')
                .addOption('warn', 'Warning')
                .addOption('error', 'Error')
                .setValue(this.plugin.settings.logLevel)
                .onChange(async (value) => {
                    this.plugin.settings.logLevel = value as 'debug' | 'info' | 'warn' | 'error';
                    await this.plugin.saveSettings();
                }));
    }
} 