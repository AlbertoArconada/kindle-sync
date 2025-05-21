# Kindle Sync for Obsidian

A plugin for [Obsidian](https://obsidian.md) that syncs your Kindle Scribe notebooks directly into your vault.

## Features

- 🔄 **Automatic Syncing**: Automatically sync your Kindle Scribe notebooks to your Obsidian vault
- 📱 **Mobile Support**: Works with the Kindle Scribe mobile app
- 📝 **Markdown Conversion**: Converts Kindle notebooks to clean, readable markdown
- 🖼️ **Image Support**: Preserves all your handwritten notes and drawings
- 🔒 **Secure**: Uses your Amazon session cookies for authentication
- 📂 **Folder Structure**: Maintains your notebook organization from Kindle

## Installation

### From Obsidian

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Kindle Sync"
4. Click Install
5. Enable the plugin

### Manual Installation

1. Download the latest release from the releases page
2. Extract the zip file into your `.obsidian/plugins` folder
3. Reload Obsidian
4. Enable the plugin in settings

## Setup

1. Open Obsidian Settings
2. Go to Kindle Sync settings
3. Get your Amazon cookies:
   - Open [Amazon Kindle Notebooks](https://read.amazon.com/kindle-notebook?ref_=neo_mm_yn_na_kfa) on your smartphone
   - Open Developer Tools (or use a network monitoring tool)
   - Go to the Network tab
   - Refresh the page
   - Look for requests to `read.amazon.com`
   - Find the `Cookie` header in the request details
   - Copy the entire cookie string
4. Paste the cookie string into the "Amazon Cookies" field
5. Click "Test Connection" to verify your settings
6. Choose your sync folder (default: `Kindle Notebooks`)
7. Enable auto-sync if desired

## Usage

### Manual Sync

1. Open the command palette (Ctrl/Cmd + P)
2. Search for "Kindle Sync: Sync Now"
3. Click to start the sync process

### Auto Sync

If enabled in settings, the plugin will automatically sync your notebooks:
- When Obsidian starts
- Every 30 minutes (configurable)
- When you return from sleep mode

### Viewing Notebooks

Synced notebooks will appear in your chosen sync folder with:
- A markdown file containing the text content
- An `assets` folder containing all images
- Original folder structure preserved

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure you're using the correct cookie string from your smartphone
   - Check that you're logged into Amazon
   - Verify you have Kindle Scribe access

2. **No Notebooks Found**
   - Make sure you have notebooks in your Kindle Scribe
   - Try refreshing the connection in settings

3. **Images Not Syncing**
   - Check your sync folder permissions
   - Ensure you have enough disk space

### Getting Help

If you encounter any issues:
1. Check the console for error messages (Ctrl/Cmd + Shift + I)
2. Look for similar issues in the [GitHub Issues](https://github.com/yourusername/kindle-sync/issues)
3. Create a new issue with:
   - Steps to reproduce
   - Error messages
   - Obsidian version
   - Plugin version

## Development

### Building from Source

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```

### Project Structure

- `main.ts` - Plugin entry point
- `services/`
  - `amazonKindleAPI.ts` - Amazon API integration
  - `notebookConverter.ts` - Notebook to markdown conversion
  - `syncService.ts` - Sync logic
- `settings.ts` - Plugin settings
- `settingsTab.ts` - Settings UI

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Obsidian](https://obsidian.md) for the amazing platform
- [tar-stream](https://github.com/mafintosh/tar-stream) for TAR file handling
- All contributors and users of the plugin 