# Electron Link Storage - Project Instructions

This is an Electron application with a transparent background for storing website links.

## Project Overview
- Creates a floating window with transparent glassmorphic UI
- Stores website links locally in JSON format
- Features a minimal, modern interface
- Click links to open in browser, delete to remove

## Development

### Setup
```bash
npm install
npm start
```

### Project Structure
- `main.js` - Electron main process and IPC handlers
- `preload.js` - Secure IPC bridge
- `renderer.js` - Frontend logic
- `index.html` - UI markup
- `styles.css` - Transparent glassmorphic design
- `package.json` - Dependencies and scripts

### Key Technologies
- Electron for desktop application
- Native Node.js File System for data storage
- CSS with backdrop blur for transparency effects
- IPC for main/renderer communication

## Completed Setup Steps
- [x] Project scaffolding
- [x] Main process configuration
- [x] Preload script for IPC security
- [x] UI with transparent background
- [x] Link storage system
- [x] Window controls (minimize, close)
- [x] Styling with glassmorphic effects
