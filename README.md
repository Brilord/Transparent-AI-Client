# Electron Link Storage

A minimal Electron application with a transparent, glass-style UI for storing and managing website links.

## Features

- 🎨 Transparent glass-style UI (frameless, transparent windows)
- 🔗 Add, view, and delete website links
- 💾 Local persistent storage using JSON
- 🖱️ Click links to open them inside transparent app windows
- ⌨️ Keyboard and mouse controls for precise window movement and resizing

## Installation

1. Install dependencies:
```powershell
npm install
```

## Running

Start the application:
```powershell
npm start
```

For development with debugging:
```powershell
npm run dev
```

To create distributable builds (Windows installer and portable exe):
```powershell
npm run build:win
```

Build artifacts are written to the `dist/` folder (installer and portable executable).

## Project Structure

- `main.js` - Electron main process with IPC handlers
- `preload.js` - Preload script for secure IPC communication (main window)
- `preload-link.js` - Preload script injected into link windows for dragging/resizing shortcuts
- `renderer.js` - Frontend logic for the main window
- `index.html` - Main UI markup
- `styles.css` - Styling with transparency effects
- `package.json` - Project configuration

## How to Use

1. Enter a website URL in the input field
2. Optionally add a custom title (defaults to domain name)
3. Click "Add Link" or press Enter
4. Click any stored link to open it in a transparent app window
5. Click "Delete" to remove a link

## Features Details

### Transparent Background & Styling
Windows are frameless and transparent. The app applies CSS to make content readable (white text) for link windows and provides a glass-like appearance for the main window.

### Data Persistence
Links are stored in the user's application data directory:
- Windows: `%APPDATA%/electron-link-storage/links.json`
- macOS: `~/Library/Application Support/electron-link-storage/links.json`
- Linux: `~/.config/electron-link-storage/links.json`

## Window Behavior & Shortcuts

This app provides both mouse and keyboard controls for frameless windows.

- Drag: click and hold the top area of any window to move it (main window: titlebar; link windows: top 40px area).
- Resize (mouse): move cursor to any window edge or corner; drag to resize. The main window includes visible resizer targets; link windows receive injected resizers where page security allows.
- Keyboard resize: hold `Ctrl + Alt` and press arrow keys to resize by 20px.
- Keyboard move: hold `Ctrl + Alt + Shift` and press arrow keys to move the window by 20px.
- Toggle maximize: `Ctrl + Alt + M` toggles maximize/restore.
- Snap shortcuts: `Ctrl + Alt + 1..5` snap the focused window to common layouts:
  - `1` = snap left half
  - `2` = snap right half
  - `3` = snap top half
  - `4` = snap bottom half
  - `5` = center the window (80% size)

Windows also auto-snap to screen edges when dragged within 20 pixels of an edge. Snapping respects the display work area (avoids taskbar overlap).

## Link Windows (External Pages)

- Clicking a stored link opens it inside a new transparent window (the app loads the URL in an Electron BrowserWindow).
- The app injects CSS to make text readable and, where allowed, injects invisible resizer elements so you can resize the window directly.
- Some websites enforce Content Security Policy (CSP) or block DOM/CSS injection; when injection is blocked use keyboard shortcuts or the top-drag area to move/resize.

## Building

- Build for Windows installer + portable exe:
```powershell
npm run build:win
```
- Outputs will be placed in `dist/`.

If the build fails, check `dist/builder-effective-config.yaml` for the resolved configuration and ensure your environment can download the Electron runtime.

## Troubleshooting

- If `npm install` fails, try removing `node_modules` and `package-lock.json` then run `npm install` again.
- If a link window does not show injected resizers due to CSP, use keyboard shortcuts or the top drag area.
- If windows do not snap as expected, verify multiple displays and scaling settings; snapping uses the display workArea to avoid overlapping the taskbar.

## License

MIT
