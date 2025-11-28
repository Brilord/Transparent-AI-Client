const { app, BrowserWindow, Menu, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let appOpacity = 1.0; // global app opacity applied to all windows
const linkWindows = new Set();
const dataFile = path.join(app.getPath('userData'), 'links.json');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

// Default app settings
const DEFAULT_SETTINGS = {
  appOpacity: 1.0,
  alwaysOnTop: false,
  injectResizers: true,
  persistSettings: true,
  // Folder sync settings
  useFolderSync: false,
  syncFolder: null,
  leftQuarterShortcut: false,
  leftThirdShortcut: false
};

let appSettings = Object.assign({}, DEFAULT_SETTINGS);

// Folder sync watcher state
let syncWatcher = null;
let lastSyncUpdatedAt = 0;

// Initialize links storage
function initializeLinksStorage() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
  }
}

// Load links from storage
function loadLinks() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading links:', error);
    return [];
  }
}

// Helper: compute sync file path when folder sync is enabled
function getSyncFilePath() {
  try {
    if (appSettings && appSettings.useFolderSync && appSettings.syncFolder) {
      return path.join(appSettings.syncFolder, 'links.json');
    }
  } catch (err) {}
  return null;
}

// Save links to storage (both local and optionally sync folder)
function saveLinks(links) {
  try {
    // Always keep local copy for app usage
    fs.writeFileSync(dataFile, JSON.stringify(links, null, 2));

    // If folder sync enabled, write a wrapper with updatedAt so other devices can detect changes
    const syncPath = getSyncFilePath();
    if (syncPath) {
      const wrapper = { updatedAt: Date.now(), links };
      try { fs.writeFileSync(syncPath, JSON.stringify(wrapper, null, 2)); lastSyncUpdatedAt = wrapper.updatedAt; } catch (err) { console.error('Error writing sync file:', err); }
    }
  } catch (error) {
    console.error('Error saving links:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    transparent: true,
    frame: false,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    resizable: true,
    movable: true,
    minWidth: 420,
    minHeight: 300,
    icon: path.join(__dirname, 'assets', 'icons', 'png', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Ensure main window honors global opacity
    // Notify main renderer of current app opacity so it can apply background-only transparency
    mainWindow.webContents.on('did-finish-load', () => {
      try { mainWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
    });

  mainWindow.loadFile('index.html');

  // Open dev tools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Snap main window to screen edges when moved
  (function attachMainSnap() {
    const SNAP = 20; // pixels
    let snapTimeout = null;
    mainWindow.on('move', () => {
      if (snapTimeout) clearTimeout(snapTimeout);
      snapTimeout = setTimeout(() => {
        try {
          const [x, y] = mainWindow.getPosition();
          const bounds = mainWindow.getBounds();
          const display = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
          const d = display.workArea; // use workArea to avoid taskbar overlap
          let nx = x;
          let ny = y;
          if (Math.abs(x - d.x) <= SNAP) nx = d.x;
          if (Math.abs((x + bounds.width) - (d.x + d.width)) <= SNAP) nx = d.x + d.width - bounds.width;
          if (Math.abs(y - d.y) <= SNAP) ny = d.y;
          if (Math.abs((y + bounds.height) - (d.y + d.height)) <= SNAP) ny = d.y + d.height - bounds.height;
          if (nx !== x || ny !== y) mainWindow.setPosition(nx, ny);
        } catch (err) {
          // ignore
        }
      }, 80);
    });
  })();
}

ipcMain.on('drag-window', (event, { deltaX, deltaY }) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    let [x, y] = window.getPosition();
    x = x + deltaX;
    y = y + deltaY;
    // Snap to edges if close
    try {
      const bounds = window.getBounds();
      const display = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
      const d = display.workArea;
      const SNAP = 20;
      if (Math.abs(x - d.x) <= SNAP) x = d.x;
      if (Math.abs((x + bounds.width) - (d.x + d.width)) <= SNAP) x = d.x + d.width - bounds.width;
      if (Math.abs(y - d.y) <= SNAP) y = d.y;
      if (Math.abs((y + bounds.height) - (d.y + d.height)) <= SNAP) y = d.y + d.height - bounds.height;
    } catch (err) {
      // ignore
    }
    window.setPosition(x, y);
  }
});

// Window bounds helpers for renderer processes
ipcMain.handle('get-window-bounds', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  return win.getBounds();
});

ipcMain.handle('set-window-bounds', (event, bounds) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !bounds) return false;
  try {
    win.setBounds(bounds);
    return true;
  } catch (err) {
    console.error('Error setting bounds:', err);
    return false;
  }
});
 
// Move window by delta
ipcMain.handle('move-window', (event, { dx = 0, dy = 0 } = {}) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    const [x, y] = win.getPosition();
    win.setPosition(x + dx, y + dy);
    return true;
  } catch (err) {
    console.error('Error moving window:', err);
    return false;
  }
});
 
// Toggle maximize / restore
ipcMain.handle('toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    if (win.isMaximized()) win.unmaximize(); else win.maximize();
    return true;
  } catch (err) {
    console.error('Error toggling maximize:', err);
    return false;
  }
});
 
// Snap window to edges (left, right, top, bottom, center)
ipcMain.handle('snap-window', (event, direction) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    const bounds = win.getBounds();
    const display = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
    const d = display.workArea;
    let nb = Object.assign({}, bounds);
    switch (direction) {
      case 'left':
        nb.x = d.x; nb.y = d.y; nb.width = Math.floor(d.width / 2); nb.height = d.height; break;
      case 'left-quarter':
        nb.x = d.x; nb.y = d.y; nb.width = Math.floor(d.width / 4); nb.height = d.height; break;
      case 'left-third':
        nb.x = d.x; nb.y = d.y; nb.width = Math.floor(d.width / 3); nb.height = d.height; break;
      case 'right':
        nb.x = d.x + Math.floor(d.width / 2); nb.y = d.y; nb.width = Math.floor(d.width / 2); nb.height = d.height; break;
      case 'top':
        nb.x = d.x; nb.y = d.y; nb.width = d.width; nb.height = Math.floor(d.height / 2); break;
      case 'bottom':
        nb.x = d.x; nb.y = d.y + Math.floor(d.height / 2); nb.width = d.width; nb.height = Math.floor(d.height / 2); break;
      case 'center':
        nb.width = Math.min(bounds.width, Math.floor(d.width * 0.8)); nb.height = Math.min(bounds.height, Math.floor(d.height * 0.8)); nb.x = d.x + Math.floor((d.width - nb.width) / 2); nb.y = d.y + Math.floor((d.height - nb.height) / 2); break;
      case 'fullscreen':
        win.maximize(); return true;
      default:
        return false;
    }
    win.setBounds(nb);
    return true;
  } catch (err) {
    console.error('Error snapping window:', err);
    return false;
  }
});

app.on('ready', () => {
  initializeLinksStorage();
  // load settings before creating windows
  try { loadSettings(); } catch (err) { /* ignore */ }
  if (typeof appSettings.appOpacity === 'number') appOpacity = appSettings.appOpacity;
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('get-links', () => {
  return loadLinks();
});

ipcMain.handle('add-link', (event, link) => {
  const links = loadLinks();
  const newLink = {
    id: Date.now(),
    url: link.url,
    title: link.title || new URL(link.url).hostname,
    createdAt: new Date().toISOString()
  };
  links.push(newLink);
  saveLinks(links);
  return newLink;
});

ipcMain.handle('delete-link', (event, id) => {
  let links = loadLinks();
  links = links.filter(link => link.id !== id);
  saveLinks(links);
  return true;
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
  mainWindow.close();
});

ipcMain.handle('open-link', (event, url) => {
  let linkWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    transparent: true,
    frame: false,
    resizable: true,
    movable: true,
    minWidth: 600,
    minHeight: 400,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-link.js')
    }
  });

  // Load the URL directly
  linkWindow.loadURL(url);

  // Apply current app opacity immediately
  try {
     // Let the link window's preload script apply background-only opacity (it listens to app-opacity-changed)
     linkWindow.webContents.send('app-opacity-changed', appOpacity);
  } catch (err) { /* ignore if unsupported */ }

  // Keep track of open link windows so we can update opacity later
  linkWindows.add(linkWindow);

  // Apply transparent styling via CSS injection
  linkWindow.webContents.on('did-finish-load', () => {
    linkWindow.webContents.insertCSS(`
      * {
        background-color: transparent !important;
        color: white !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      html, body {
        background: transparent !important;
      }
      a {
        color: #87ceeb !important;
      }
      a:visited {
        color: #da70d6 !important;
      }
      button, input[type="button"], input[type="submit"] {
        color: white !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
      }
      button:hover, input[type="button"]:hover, input[type="submit"]:hover {
        background: rgba(255, 255, 255, 0.3) !important;
      }
      input, textarea, select {
        background: rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
      input::placeholder, textarea::placeholder {
        color: rgba(255, 255, 255, 0.6) !important;
      }
      html::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        -webkit-app-region: drag;
        z-index: 10000;
        pointer-events: auto;
      }
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `);
  });

  // Snap behavior for link windows as well
  (function attachLinkSnap(win) {
    const SNAP = 20;
    let snapTimeout = null;
    win.on('move', () => {
      if (snapTimeout) clearTimeout(snapTimeout);
      snapTimeout = setTimeout(() => {
        try {
          const [x, y] = win.getPosition();
          const bounds = win.getBounds();
          const display = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
          const d = display.workArea;
          let nx = x;
          let ny = y;
          if (Math.abs(x - d.x) <= SNAP) nx = d.x;
          if (Math.abs((x + bounds.width) - (d.x + d.width)) <= SNAP) nx = d.x + d.width - bounds.width;
          if (Math.abs(y - d.y) <= SNAP) ny = d.y;
          if (Math.abs((y + bounds.height) - (d.y + d.height)) <= SNAP) ny = d.y + d.height - bounds.height;
          if (nx !== x || ny !== y) win.setPosition(nx, ny);
        } catch (err) {}
      }, 80);
    });
  })(linkWindow);

  linkWindow.on('closed', function () {
    linkWindows.delete(linkWindow);
    linkWindow = null;
  });

  return true;
});

// Set opacity for all existing windows
ipcMain.handle('set-app-opacity', (event, value) => {
  try {
    if (typeof value !== 'number') value = parseFloat(value);
    if (isNaN(value)) return false;
    value = Math.max(0.05, Math.min(1, value));
    appOpacity = value;
    // Mirror to settings and persist if enabled
    appSettings.appOpacity = appOpacity;
    if (appSettings.persistSettings) saveSettings();

    // Update main window
      // Tell renderers to update their background-only opacity
      BrowserWindow.getAllWindows().forEach(w => {
        try { w.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
      });

    // (renderers are notified above) — link windows will update via 'app-opacity-changed' message

    return true;
  } catch (err) {
    console.error('Error setting app opacity:', err);
    return false;
  }
});

ipcMain.handle('get-app-opacity', () => {
  return appOpacity;
});

// Settings persistence & helpers
function loadSettings() {
  try {
    if (!fs.existsSync(settingsFile)) {
      // write defaults if persist setting is enabled
      fs.writeFileSync(settingsFile, JSON.stringify(appSettings, null, 2));
      return appSettings;
    }
    const raw = fs.readFileSync(settingsFile, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    appSettings = Object.assign({}, DEFAULT_SETTINGS, parsed);
    // reflect appOpacity from settings
    if (typeof appSettings.appOpacity === 'number') appOpacity = appSettings.appOpacity;
    return appSettings;
  } catch (err) {
    console.error('Error loading settings:', err);
    appSettings = Object.assign({}, DEFAULT_SETTINGS);
    return appSettings;
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(appSettings, null, 2));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

ipcMain.handle('get-setting', (event, key) => {
  if (!key) return null;
  return appSettings[key];
});

ipcMain.handle('get-all-settings', () => {
  return appSettings;
});

ipcMain.handle('set-setting', (event, key, value) => {
  if (!key) return false;
  appSettings[key] = value;
  // Persist settings if enabled
  if (appSettings.persistSettings) saveSettings();

  // react to certain setting changes immediately
  try {
    if (key === 'alwaysOnTop') {
      // update main window
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(!!value);
      // update link windows
      for (const win of linkWindows) {
        if (win && !win.isDestroyed()) win.setAlwaysOnTop(!!value);
      }
    }

    if (key === 'appOpacity') {
      // keep appOpacity in sync
      const v = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(v)) {
        appOpacity = Math.max(0.05, Math.min(1, v));
        // Notify renderers to update their background opacity (main renderer and link preloads will react)
        if (mainWindow && !mainWindow.isDestroyed()) try { mainWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
        for (const win of linkWindows) if (win && !win.isDestroyed()) try { win.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
      }
    }
  } catch (err) { /* ignore */ }

  // If folder sync settings changed, start/stop watcher accordingly
  try {
    if (key === 'useFolderSync' || key === 'syncFolder') {
      if (appSettings.useFolderSync && appSettings.syncFolder) startSyncWatcher();
      else stopSyncWatcher();
    }
  } catch (err) {}
  try {
    if (key === 'useFolderSync' && appSettings.useFolderSync && appSettings.syncFolder) {
      // push current local links into sync file so the chosen folder has the latest state
      try { saveLinks(loadLinks()); } catch (e) {}
    }
  } catch (err) {}

  // Broadcast change to all windows
  BrowserWindow.getAllWindows().forEach(w => {
    try { w.webContents.send('setting-changed', key, appSettings[key]); } catch (e) {}
  });

  return true;
});

// Expose a reset endpoint
ipcMain.handle('reset-settings', () => {
  appSettings = Object.assign({}, DEFAULT_SETTINGS);
  saveSettings();

  // apply to windows
  try { appOpacity = appSettings.appOpacity; } catch (e) {}
    if (mainWindow && !mainWindow.isDestroyed()) {
      try { mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop); mainWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
  }
  for (const win of linkWindows) if (win && !win.isDestroyed()) {
     try { win.setAlwaysOnTop(appSettings.alwaysOnTop); win.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
  }

  BrowserWindow.getAllWindows().forEach(w => {
    try { w.webContents.send('settings-reset', appSettings); } catch (e) {}
  });

  return appSettings;
});

// Start the sync watcher for syncFolder if enabled
function startSyncWatcher() {
  try {
    stopSyncWatcher();
    const syncPath = getSyncFilePath();
    if (!syncPath) return;
    // initialize lastSyncUpdatedAt from existing file
    try {
      if (fs.existsSync(syncPath)) {
        const data = fs.readFileSync(syncPath, 'utf8');
        const parsed = JSON.parse(data);
        lastSyncUpdatedAt = parsed && parsed.updatedAt ? parsed.updatedAt : 0;
      }
    } catch (err) { lastSyncUpdatedAt = 0; }

    // Use fs.watchFile for robust cross-platform polling
    fs.watchFile(syncPath, { interval: 1500 }, (curr, prev) => {
      try {
        if (!fs.existsSync(syncPath)) return;
        const raw = fs.readFileSync(syncPath, 'utf8');
        const parsed = JSON.parse(raw);
        const updatedAt = parsed && parsed.updatedAt ? parsed.updatedAt : 0;
        const remoteLinks = (parsed && Array.isArray(parsed.links)) ? parsed.links : [];
        if (updatedAt && updatedAt > lastSyncUpdatedAt) {
          // Update local copy and notify renderers
          try { fs.writeFileSync(dataFile, JSON.stringify(remoteLinks, null, 2)); } catch (err) {}
          lastSyncUpdatedAt = updatedAt;
          BrowserWindow.getAllWindows().forEach(w => {
            try { w.webContents.send('links-changed'); } catch (e) {}
          });
        }
      } catch (err) {
        // ignore parse errors
      }
    });
    syncWatcher = true;
  } catch (err) {
    console.error('Error starting sync watcher:', err);
  }
}

function stopSyncWatcher() {
  try {
    const syncPath = getSyncFilePath();
    if (syncPath && fs.existsSync(syncPath)) {
      try { fs.unwatchFile(syncPath); } catch (e) {}
    }
    syncWatcher = null;
    lastSyncUpdatedAt = 0;
  } catch (err) {}
}

// IPC: open folder picker for user to choose a sync folder
ipcMain.handle('choose-sync-folder', async () => {
  try {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (res && !res.canceled && res.filePaths && res.filePaths[0]) {
      const chosen = res.filePaths[0];
      appSettings.syncFolder = chosen;
      if (appSettings.persistSettings) saveSettings();
      // start watcher if enabled
      if (appSettings.useFolderSync) startSyncWatcher();
      return chosen;
    }
    return null;
  } catch (err) {
    console.error('Error choosing sync folder:', err);
    return null;
  }
});

ipcMain.handle('get-sync-folder', () => {
  return appSettings.syncFolder || null;
});

// Ensure watcher starts on app ready if enabled
app.on('ready', () => {
  try { if (appSettings.useFolderSync && appSettings.syncFolder) startSyncWatcher(); } catch (e) {}
});
