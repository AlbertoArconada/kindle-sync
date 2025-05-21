# Kindle Scribe Sync for Obsidian

This Obsidian plugin allows you to synchronize your Kindle Scribe notebooks with your Obsidian vault. It supports bidirectional synchronization, converting handwritten notes to markdown, and preserving drawings as images.

## Features

- Connect to your Kindle Scribe device through Amazon's cloud services
- Select which notebooks to synchronize
- Convert handwritten text to markdown format
- Preserve drawings as images in your notes
- Support for markdown elements (lists, tables, code blocks, etc.)
- Bidirectional synchronization
- Real-time sync status and logs
- Configurable sync settings

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Click "Browse" and search for "Kindle Scribe Sync"
4. Click Install
5. Enable the plugin

## Configuration

1. Open Obsidian Settings
2. Go to Kindle Scribe Sync settings
3. Enter your Amazon account credentials
4. Configure sync settings:
   - Sync interval
   - Auto-sync
   - Image quality
   - Markdown conversion
   - Bidirectional sync
   - Log level

## Usage

1. Click the Kindle Sync icon in the ribbon to open the sync modal
2. Select the notebooks you want to synchronize
3. Click "Sync Selected Notebooks"
4. Monitor the sync status and logs in the status view

## Requirements

- Obsidian v0.15.0 or higher
- Kindle Scribe device
- Amazon account with Kindle Scribe registered
- Internet connection

## Development

To build the plugin:

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 