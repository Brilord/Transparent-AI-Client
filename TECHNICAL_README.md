# Technical README - PlanaClientV2.0

An in-depth look at how this Electron link manager is structured, how data moves through it, and what the key functions do.

---

## 1. Architecture Overview

| Layer | Files | Responsibilities |
| --- | --- | --- |
| Main process | `main.js` | Bootstraps Electron, manages BrowserWindows, handles IPC, persists links/settings/backups, controls window behaviors (opacity, snapping, always-on-top), manages folder sync and OS login toggles. |
| Main renderer | `index.html`, `renderer.js`, `styles.css` | Provides the UI for adding/searching links, viewing settings, rendering resizer handles, and applying the glassmorphic visuals. |
| Preload (main window) | `preload.js` | Bridges IPC safely via `contextBridge`, exposes `window.electron/windowManager/windowActions`, and installs keyboard shortcuts for resizing, moving, and snapping the frameless window. |
| Link-window preload | `preload-link.js` | Injected into every external link BrowserWindow to add keyboard shortcuts for resizing/moving/snapping without exposing Node APIs to remote content. |

The entry point is `main.js` (`package.json.main`). Build packaging lives in `package.json#build` via electron-builder.

---

## 2. Application Lifecycle and Data Flow

1. **Startup**
   - `initializeLinksStorage()` (`main.js:61-72`) ensures `links.json` exists in `app.getPath('userData')`.
   - `loadSettings()` (`main.js:645-709`) merges `DEFAULT_SETTINGS` (`main.js:35-54`) with `settings.json`, syncs the `launchOnStartup` flag with the OS, and restores `appOpacity`.
   - `createWindow()` (`main.js:140-209`) opens the transparent main BrowserWindow, injects `preload.js`, and debounces bounds persistence via `mainWindow.on('move'/'resize')`.

2. **IPC wiring**: All IPC handlers are defined in `main.js:210-873` before `app.whenReady()` completes so renderer calls succeed immediately.

3. **Link catalog**
   - Renderer loads all links via `window.electron.getLinks()` -> `ipcMain.handle('get-links')` -> `loadLinks()`.
   - Mutations (add/delete/favorite/bulk/import/export/backup) flow through IPC. `saveLinks()` (`main.js:92-108`) always writes the local JSON and, if folder sync is enabled, mirrors `{ updatedAt, links }` into the selected sync folder.

4. **Link BrowserWindows**
   - `ipcMain.handle('open-link', ...)` (`main.js:588-605`) delegates to `openLinkWindow()` (`main.js:437-587`). Windows restore saved bounds from `links[idx].lastBounds`, apply eased opacity (`getLinkWindowOpacity()`, `main.js:13-20`), and intercept `window.open` so navigations stay inside the same window.
   - Bound changes debounce into `links[idx].lastBounds` for persistent per-link positioning.

5. **Settings and Opacity**
   - `ipcMain.handle('set-app-opacity')` (`main.js:614-644`) clamps the slider value, persists it, broadcasts `app-opacity-changed` to every WebContents, and calls `applyOpacityToLinkWindows()` (`main.js:21-33`) so native window translucency matches the UI.
   - `ipcMain.handle('set-setting')` (`main.js:710-816`) updates the settings object, triggers side effects (always-on-top, launch-on-startup, opacity mirroring, folder sync watcher), and broadcasts `setting-changed`.

6. **Folder Sync**
   - `startSyncWatcher()` / `stopSyncWatcher()` (`main.js:817-856`) watch `<syncFolder>/links.json` via `fs.watchFile()`. When a newer `updatedAt` is detected, the local `links.json` is overwritten and renderers receive `links-changed` so they reload.
   - `choose-sync-folder` IPC (`main.js:867-873`) lets the renderer set `syncFolder`; enabling `useFolderSync` kicks off the watcher and immediately pushes the current local links into the sync directory.

7. **Shutdown**
   - `app.on('before-quit')` (`main.js:306-312`) snapshots open link windows via `persistOpenLinksState()` (`main.js:116-139`) and closes every tracked link window (`closeAllLinkWindows()`, `main.js:109-115`). Next launch, `reopenLastLinksIfAvailable()` (`main.js:593-612`) reopens them.

---

## 3. Data Model

### Links (`links.json`)

Created in `add-link` (`main.js:326-343`) with:

```jsonc
{
  "id": 1710894038297,
  "url": "https://example.com",
  "title": "Example",
  "createdAt": "ISO string",
  "updatedAt": "ISO string",
  "favorite": false,
  "tags": [],
  "lastBounds": { "x": 100, "y": 80, "width": 900, "height": 700 }
}
```

Imports merge by `id`; duplicates are skipped. Favorites toggle via `toggle-favorite` (`main.js:342-353`). `bulk-delete` prunes by ID array (`main.js:354-363`).

### Settings (`settings.json`)

`DEFAULT_SETTINGS` contains:
- Window state: `mainWindowBounds`, `appOpacity`, `alwaysOnTop`, `injectResizers`, `persistSettings`, `lastOpenedLinks`.
- Features: `useFolderSync`, `syncFolder`, `leftQuarterShortcut`, `leftThirdShortcut`, `telemetryEnabled`.
- System: `launchOnStartup`.

`saveSettings()` (`main.js:678-692`) writes the JSON whenever `persistSettings` is true. Login item updates happen via `setLaunchOnStartup()` (`main.js:693-713`).

### Derived files
- Backups: `appData/backups/links-<timestamp>.json` created by `manual-backup` (`main.js:402-419`), pruned to `keepN` files.
- Sync folder: `<syncFolder>/links.json` contains `{ updatedAt, links }` for multi-device sync.

---

## 4. Main Process API Surface

| Handler or Function | Purpose |
| --- | --- |
| `ipcMain.handle('get/set-window-bounds')`, `move-window`, `toggle-maximize`, `snap-window` (`main.js:210-292`) | Support mouse/keyboard resizing and moving for frameless windows. Snapping uses `screen.getDisplayMatching(bounds).workArea` and supports left/right/top/bottom/center plus left-quarter/left-third when enabled. |
| `ipcMain.handle('get-links'...'manual-backup')` (`main.js:322-419`) | CRUD, export/import, and backup of the link catalog. |
| `ipcMain.handle('open-link')` -> `openLinkWindow()` (`main.js:420-605`) | Opens an external BrowserWindow, applies opacity, saves bounds, and tracks metadata in `linkWindowMeta`. |
| `ipcMain.handle('set-app-opacity')` with `applyOpacityToLinkWindows()` (`main.js:614-644`, `21-33`) | Global opacity pipeline with easing to keep link windows legible (minimum 0.68). |
| `ipcMain.handle('get/set/reset-setting')` (`main.js:710-816`) | Generic settings API plus immediate reactions (always-on-top, opacity, launch-on-startup, folder sync). |
| Sync helpers (`startSyncWatcher`, `stopSyncWatcher`, `choose-sync-folder`) (`main.js:817-873`) | Folder sync enable/disable and picker. |
| Lifecycle helpers (`closeAllLinkWindows`, `persistOpenLinksState`, `reopenLastLinksIfAvailable`) (`main.js:109-139`, `593-612`) | Remember which link windows were open and restore them on next launch. |

---

## 5. Renderer Logic (`renderer.js`)

1. **Opacity visuals**: `applyBackgroundVisuals()` (`renderer.js:20-48`) maps the slider value to CSS custom properties for blur, alpha, and border intensity. The `<body>` gets `transparent-mode` when opacity is near zero.
2. **Link UI**: `loadLinks()` fetches data, stores it in `currentLinks`, and calls `renderLinks()` (`renderer.js:338-386`). Each entry renders checkboxes, favorite/delete buttons, and clicking the content area calls `openLinkWithId(id, url)` so per-link bounds are used.
3. **Input validation**: `addLink()` (`renderer.js:302-337`) validates URLs with the `URL` constructor, then invokes `add-link` IPC.
4. **Settings drawer**: `initSettingsUI()` (`renderer.js:203-242`) loads all settings, wires checkboxes to `setSetting`, handles folder sync selection, reset-to-defaults, and listens for `setting-changed` broadcasts.
5. **Window controls**: Minimize/close buttons call `window.electron.minimizeWindow()` / `closeWindow()` (`renderer.js:93-110`). Keyboard shortcuts live in `preload.js:57-104`.
6. **Resizers**: `.resizer` divs (defined in `index.html:118-125`, styled at `styles.css:278-311`) call `windowManager.getBounds()` and `setBounds()` as the mouse drags edges/corners (`renderer.js:244-301`).
7. **Search and bulk actions**: Search filters `currentLinks` client-side (`renderer.js:399-405`). Buttons call export/import/backup/bulk-delete IPC endpoints (`renderer.js:410-439`).
8. **Telemetry toggle**: `telemetryChk` reads/writes the `telemetryEnabled` setting, though no telemetry client exists yet (`renderer.js:441-452`).

---

## 6. Preload Scripts

- `preload.js`
  - Exposes IPC helpers via `contextBridge` (`window.electron`, `windowManager`, `windowActions`).
  - Listens for `app-opacity-changed`, `links-changed`, and `setting-changed` broadcasts and forwards them to renderer callbacks.
  - Installs global keydown handlers so the main window always responds to Ctrl+Alt shortcuts even when inputs are focused (`preload.js:57-104`).

- `preload-link.js`
  - Adds the same keyboard shortcuts to link BrowserWindows plus optional shortcuts for left-quarter/left-third snapping when settings enable them (`preload-link.js:6-84`).

---

## 7. Keyboard and Pointer Shortcuts

| Shortcut | Scope | Behavior |
| --- | --- | --- |
| Ctrl + Alt + Arrow | Main and link windows | Resize by plus or minus 20px in that direction (`preload.js`, `preload-link.js`). |
| Ctrl + Alt + Shift + Arrow | Main and link windows | Move window by plus or minus 20px (`move-window`). |
| Ctrl + Alt + M | Main and link windows | Toggle maximize/restore (`toggle-maximize`). |
| Ctrl + Alt + 1..5 | Main and link windows | Snap to left/right/top/bottom/center (`snap-window`). |
| Ctrl + Alt + 6 | Optional | Snap to left quarter when `leftQuarterShortcut` is true. |
| Ctrl + Alt + 7 | Optional | Snap to left third when `leftThirdShortcut` is true. |
| Mouse drag edges/corners | Main window | Resize via `.resizer` divs hitting `windowManager.setBounds()`. |

---

## 8. Build and Packaging

- `npm start` runs Electron normally.
- `npm run dev` runs with remote debugging enabled.
- `npm run build:win`, `build:mac`, `build:linux`, `build:portable` run electron-builder targets defined in `package.json:24-45` (NSIS + portable exe, DMG/ZIP, AppImage/deb). Artifacts land in `dist/`.
- Icons live in `assets/icons/...`; `build.directories.buildResources` points to `assets` so installer art is bundled automatically.

---

## 9. Extension Ideas and Observations

1. `injectResizers` is persisted but unused. Future work could guard the `.resizer` overlay or add DOM injection to link windows based on this flag.
2. `telemetryEnabled` is stored but never consumed. Wire it to an actual crash reporter if needed.
3. `tags` arrays default to empty; the UI never edits them, but search matches tags if they exist (for example via imports).
4. Several glyphs in `index.html` / `renderer.js` render as `??`; replace them with proper UTF-8 icons or inline SVGs.
5. There are no automated tests. Consider unit tests around `saveLinks()` / `loadLinks()`, sync watcher behavior, and window snapping math.
6. Many IPC handlers swallow errors; surfacing failures back to the renderer would improve UX when file dialogs fail or sync folders disappear.

---

This document complements the user-facing `README.md` by describing the internal structure and data flows so maintainers can extend the app confidently.
