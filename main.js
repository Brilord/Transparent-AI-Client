const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const dataFile = path.join(app.getPath('userData'), 'links.json');

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

// Save links to storage
function saveLinks(links) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(links, null, 2));
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
    alwaysOnTop: false,
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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-link.js')
    }
  });

  // Load the URL directly
  linkWindow.loadURL(url);

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
    linkWindow = null;
  });

  return true;
});
