# Electron Link Storage

A minimal Electron application with a transparent, frosted glass UI for storing and managing website links.

## Features

- 🎨 Transparent background with glassmorphism design
- 🔗 Add, view, and delete website links
- 💾 Local persistent storage using JSON
- 🖱️ Click links to open in browser
- 🎯 Clean, minimal interface
- ⌨️ Keyboard shortcuts (Enter to add link)

## Installation

1. Install dependencies:
```bash
npm install
```

## Running

Start the application:
```bash
npm start
```

For development with debugging:
```bash
npm run dev
```

## Project Structure

- `main.js` - Electron main process with IPC handlers
- `preload.js` - Preload script for secure IPC communication
- `renderer.js` - Frontend logic
- `index.html` - Main UI markup
- `styles.css` - Styling with transparency effects
- `package.json` - Project configuration

## How to Use

1. Enter a website URL in the input field
2. Optionally add a custom title (defaults to domain name)
3. Click "Add Link" or press Enter
4. Click any link to open it in your browser
5. Click "Delete" to remove a link

## Features Details

### Transparent Background
The window has a transparent background with a glassmorphic effect using:
- Semi-transparent gradient background
- Backdrop blur effect
- Border with reduced opacity

### Data Persistence
Links are stored in the user's application data directory:
- Windows: `%APPDATA%/electron-link-storage/links.json`
- macOS: `~/Library/Application Support/electron-link-storage/links.json`
- Linux: `~/.config/electron-link-storage/links.json`

## License

MIT
