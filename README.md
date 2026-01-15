# Transparent AI Client

Transparent AI Client is a minimal Electron app for saving website links and opening them in transparent, glass-style windows. It includes tagging, quick filters, inline editing, and a flexible storage picker.

## Highlights

- Transparent glass-style UI (frameless windows)
- Save, tag, pin, and favorite links
- Open links in embedded transparent windows or your browser
- JSON storage with a custom picker (syncable file location)
- Keyboard + mouse controls for move/resize
- Metadata + health checks with smart search
- CSV/JSON import/export and quick capture tools

## Quick Start

Install dependencies:
```powershell
npm install
```

Run the app:
```powershell
npm start
```

Run in dev mode (debugging):
```powershell
npm run dev
```

## Features

### Link Management

- Add links with optional titles and tags
- Inline actions: open window, open browser, copy, edit, pin/unpin, favorite, delete
- Pinned links stay at the top
- Bulk tag actions and tag chips for quick filtering

### Smart Search + Metadata

- Fuzzy or exact search
- Favorite tag chips and multi-tag filtering
- Background metadata fetch (title, description, favicon, theme color)
- Periodic URL health checks with status badges

### Capture + Organization

- Folder, priority, and notes fields
- Drag-and-drop capture and clipboard detection
- Grouping by folder or tag
- Drag reorder within groups (order persists)
- JSON and CSV import/export

### Options and Window Controls

Open the Options panel from the titlebar gear to tweak capture defaults, window behavior, and background refresh jobs:

- Window transparency slider (applies to all open windows)
- Always on top
- Persist settings across restarts
- Inject resizers into link windows
- Reset to defaults
- Capture defaults (preset tags/folder/priority plus auto-favorite/pin/open)
- Tune link window defaults (size, centering, and whether to restore the previous session)
- Control metadata and health refresh toggles/intervals
- Auto-save workspace on exit and customize quick access layout

### Resizer Injection

When enabled, the app injects invisible resizers into link windows to allow edge dragging. Some sites block injection via CSP; if so, use keyboard shortcuts or OS window controls.

## Usage

1. Enter a URL
2. Add an optional title and tags
3. Click Add Link (or press Enter)
4. Click a card to open the link in a transparent window

## Data Storage

Default file location:

- Windows: `%APPDATA%/electron-link-storage/links.json`
- macOS: `~/Library/Application Support/electron-link-storage/links.json`
- Linux: `~/.config/electron-link-storage/links.json`

Use the Options panel to pick a custom `links.json` file (local or synced).

## Keyboard Shortcuts

### Window Movement and Resize

- Drag: click and hold the top area of a window
- Resize (mouse): drag any edge or corner (if resizers are enabled)
- Resize (keyboard): `Ctrl + Alt + Arrow` (20px)
- Move (keyboard): `Ctrl + Alt + Shift + Arrow` (20px)
- Toggle maximize: `Ctrl + Alt + M`
- Center window: `Ctrl + Alt + C`
- Reset main window bounds: `Ctrl + Alt + R`

### App Controls

- Focus search: `Ctrl + Alt + F`
- Focus capture URL: `Ctrl + Alt + L`
- Toggle Options panel: `Ctrl + Alt + O`
- Toggle Help: `Ctrl + H`
- Toggle always-on-top: `Ctrl + Alt + T`
- Toggle resizer injection: `Ctrl + Alt + I`
- Adjust opacity: `Ctrl + Alt + [` / `Ctrl + Alt + ]`

### Link Window Controls

- Snap left third: `Alt + 6`
- Snap right third: `Alt + 9`
- Reload: `Alt + R`
- Open in browser: `Alt + B`
- Copy URL: `Alt + C`
- Copy selection: `Alt + S`

## Testing

- Smoke suite: `npm test`

## Benchmarking

Run with perf logging:
```bash
npm run bench:startup
```

Windows alternative:
```powershell
set PERF_BENCH=1 && electron .
```

Logs include:

- app ready
- main window ready-to-show
- main window did-finish-load
- renderer first render

## Build

### Windows

```powershell
npm ci
npm run build:win
```

Artifacts land in `transparent-ai-client-dist/`.

### macOS

Builds must run on macOS (locally or in CI):
```bash
npm ci
npm run build:mac
```

Unsigned ZIPs are possible without signing; DMG signing may fail without credentials.

### Linux

```bash
npm ci
npm run build:linux
```

## CI Workflows

- `.github/workflows/build-windows.yml`
- `.github/workflows/build-mac.yml`
- `.github/workflows/build-linux.yml`

## Project Structure

- `src/` application code
  - `src/main/main.js` main process entry
  - `src/main/preload*.js` preload scripts
  - `src/renderer/` renderer HTML/JS/CSS
  - `src/locales/` locale JSON
- `assets/` packaging resources
- `tests/` Playwright smoke tests
- `transparent-ai-client-dist/` and `dist/` build outputs
- Root configs: `package.json`, `README.md`, `TECHNICAL_README.md`

## Troubleshooting

- If `npm install` fails, delete `node_modules` and `package-lock.json`, then rerun `npm install`.
- If resizer injection fails due to CSP, use keyboard shortcuts or OS window controls.

## License

See `LICENSE`.
