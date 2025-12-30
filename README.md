# Transparent AI Client

A minimal Electron application (Transparent AI Client) with a transparent, glass-style UI for storing and managing website links.

## Features

- 🎨 Transparent glass-style UI (frameless, transparent windows)
- 🔗 Add, view, and delete website links
- 💾 Local persistent storage using JSON
- 🖱️ Click links to open them inside transparent app windows
- ⌨️ Keyboard and mouse controls for precise window movement and resizing
- 🗂️ Custom storage picker so you can point Transparent AI Client at any `links.json` file, edit it manually, or keep it inside a synced folder.
- 🏷️ Tag links, filter by tag chips, and bulk-apply tags to keep large libraries organized.
- 🧰 Manage every entry inline with edit, open-in-browser, copy, pin/unpin, and favorite toggles without leaving the catalog.

### Options / Transparency

- ⚙️ New Options tab: open the settings (gear) in the titlebar to reveal a "Window transparency" slider. This adjusts the opacity of the main window and any currently open link windows in real time.
Additional options in the same panel:

- ✅ Always on top — keep the app and link windows above other apps.
- 🔁 Persist settings — save option changes (opacity / always-on-top / resizer injection) across app restarts.
- 🔧 Inject resizers — toggle whether the app attempts to insert invisible resizer handles into link windows (some websites block injection; if disabled use keyboard shortcuts for resizing instead).
- ♻️ Reset to defaults — quickly reset all options to the app defaults.
  You can toggle each shortcut on/off from the Options panel.

### Tags & Quick Filters

- Add comma-separated tags when creating or editing a link.
- The toolbar shows quick tag chips so you can scope the list to a single workflow in one click.
- Use the “Tag selected” bulk action to replace or clear the tags for any set of selected links.

### Inline Link Actions

- Each card exposes “Open window”, “Open browser”, “Copy”, “Edit”, “Pin/Unpin”, “Fav/Unfav”, and “Delete” buttons.
- Editing expands an inline form so you can update the title, URL, and tags without closing the main window.
- Pinned links live in their own section at the top of the list so important dashboards are always within reach.

### Resizer Injection Toggle

- The Inject resizers option now controls both the glass overlays around the main window and the handles we inject into link windows.
- Disable it if a specific site misbehaves (keyboard shortcuts and OS chrome remain available), or enable it to regain edge drag handles on embedded pages.

### Smart search, metadata, and capture

- Switch between fuzzy and exact search modes so typos or partial words still match. You can pin favorite tags (right-click on the chips) and even activate multiple tags at once for granular filtering.
- Each saved URL now gathers metadata (title, description, favicon, theme color) and periodically runs HEAD checks to flag redirects or broken links. Badges on every card surface the latest status, and inline buttons let you requeue metadata or health refreshes instantly.
- Capture more context with folder, priority, and notes fields. Group the catalog by folder or tag, and drag cards within a group or the pinned section to reorder them—order persists across app restarts.
- Clipboard detection, drag-and-drop capture, and the mini form let you stash new links without manual typing. The app also supports JSON **and** CSV import/export so backups slot neatly into spreadsheets or other machines.

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

Build artifacts are written to the `transparent-ai-client-dist/` folder (installer and portable executable).

## macOS build

You can build macOS artifacts (dmg and zip) using electron-builder. Note: building macOS packages must run on macOS (locally or in CI). For macOS builds you can either build locally on a Mac or use the supplied GitHub Actions workflow.

To build locally on macOS:

```bash
# Install deps
npm ci

# Build DMG and ZIP
npm run build:mac
```

If you do not have code signing set up, electron-builder can still create unsigned ZIP artifacts; DMG creation may attempt signing and can fail without a developer certificate. Use a CI mac runner or add signing credentials to create signed installers.

Or use the included GitHub Actions workflow which runs on macOS and uploads build artifacts automatically:

- .github/workflows/build-mac.yml (runs on push to main or manually via workflow_dispatch)
 - .github/workflows/build-windows.yml (runs on push to main or manually via workflow_dispatch)

### Linux build

You can build Linux artifacts (AppImage and deb) using electron-builder. Builds should run on a Linux machine or CI runner. The included GitHub Actions workflow will run on ubuntu-latest and upload the `transparent-ai-client-dist/` folder when the workflow completes.

To build locally on Linux:

```bash
# Install deps
npm ci

# Build AppImage and deb
npm run build:linux
```

Or use the included CI workflow:

- .github/workflows/build-linux.yml (runs on push to main or manually via workflow_dispatch)
 - .github/workflows/build-windows.yml (runs on push to main or manually via workflow_dispatch)


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
Prefer a different location? Use the Options → “Links storage JSON” controls to choose any other file (and open it quickly for manual editing) without leaving the app.

## Window Behavior & Shortcuts

This app provides both mouse and keyboard controls for frameless windows.

- Drag: click and hold the top area of any window to move it (main window: titlebar; link windows: top 40px area).
- Resize (mouse): move cursor to any window edge or corner; drag to resize. The main window includes visible resizer targets; link windows receive injected resizers where page security allows.
- Keyboard resize: hold `Ctrl + Alt` and press arrow keys to resize by 20px.
 - Keyboard move: hold `Ctrl + Alt + Shift` and press arrow keys to move the window by 20px.
 - Toggle maximize: `Ctrl + Alt + M` toggles maximize/restore.
 - Center window: `Ctrl + Alt + C`.
 - Reset main window bounds: `Ctrl + Alt + R` (main window only).
 - Snap link window to left third: `Alt + 6` (link windows only).
 - Snap link window to right third: `Alt + 9` (link windows only).
 - Dragging a window near a screen edge lets the operating system snap it, just like any other application—Transparent AI Client no longer adds extra snap layouts.

## Link Windows (External Pages)

- Clicking a stored link opens it inside a new transparent window (the app loads the URL in an Electron BrowserWindow).
- The app injects CSS to make text readable and, where allowed, injects invisible resizer elements so you can resize the window directly.
- Some websites enforce Content Security Policy (CSP) or block DOM/CSS injection; when injection is blocked use keyboard shortcuts or the top-drag area to move/resize.

## Building

- Build for Windows installer + portable exe:
```powershell
npm run build:win
```
- Outputs will be placed in `transparent-ai-client-dist/`.

If the build fails, check `transparent-ai-client-dist/builder-effective-config.yaml` for the resolved configuration and ensure your environment can download the Electron runtime.

## Troubleshooting

- If `npm install` fails, try removing `node_modules` and `package-lock.json` then run `npm install` again.
- If a link window does not show injected resizers due to CSP, use keyboard shortcuts or the top drag area.

## License

See `LICENSE`.





git tag v1.0.0
git push origin v1.0.0

