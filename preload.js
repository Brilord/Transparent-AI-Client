const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getLinks: () => ipcRenderer.invoke('get-links'),
  addLink: (link) => ipcRenderer.invoke('add-link', link),
  deleteLink: (id) => ipcRenderer.invoke('delete-link', id),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  openLink: (url) => ipcRenderer.invoke('open-link', url)
  ,
  // App-level settings
  getAppOpacity: () => ipcRenderer.invoke('get-app-opacity'),
  setAppOpacity: (value) => ipcRenderer.invoke('set-app-opacity', value),
  onAppOpacityChanged: (cb) => {
    ipcRenderer.on('app-opacity-changed', (evt, val) => cb(val));
  }
  ,
  // Folder sync helpers
  chooseSyncFolder: () => ipcRenderer.invoke('choose-sync-folder'),
  getSyncFolder: () => ipcRenderer.invoke('get-sync-folder'),
  onLinksChanged: (cb) => {
    ipcRenderer.on('links-changed', () => cb());
  },
  // Generic settings API
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  onSettingChanged: (cb) => {
    ipcRenderer.on('setting-changed', (evt, key, value) => cb(key, value));
  },
  resetSettings: () => ipcRenderer.invoke('reset-settings')
});

// Window management helpers
contextBridge.exposeInMainWorld('windowManager', {
  getBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setBounds: (bounds) => ipcRenderer.invoke('set-window-bounds', bounds)
});

// expose additional window controls
contextBridge.exposeInMainWorld('windowActions', {
  move: (dx, dy) => ipcRenderer.invoke('move-window', { dx, dy }),
  toggleMaximize: () => ipcRenderer.invoke('toggle-maximize'),
  snap: (dir) => ipcRenderer.invoke('snap-window', dir)
});

// Keybindings for main renderer window
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', async (e) => {
    // Resize: Ctrl+Alt + Arrow
    if (e.ctrlKey && e.altKey && !e.shiftKey) {
      const step = 20;
      const bounds = await ipcRenderer.invoke('get-window-bounds');
      if (!bounds) return;
      switch (e.key) {
        case 'ArrowLeft': bounds.width = Math.max(200, bounds.width - step); break;
        case 'ArrowRight': bounds.width = bounds.width + step; break;
        case 'ArrowUp': bounds.height = Math.max(120, bounds.height - step); break;
        case 'ArrowDown': bounds.height = bounds.height + step; break;
        default: return;
      }
      e.preventDefault();
      await ipcRenderer.invoke('set-window-bounds', bounds);
      return;
    }

    // Move: Ctrl+Alt+Shift + Arrow
    if (e.ctrlKey && e.altKey && e.shiftKey) {
      const moveStep = 20;
      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowLeft': dx = -moveStep; break;
        case 'ArrowRight': dx = moveStep; break;
        case 'ArrowUp': dy = -moveStep; break;
        case 'ArrowDown': dy = moveStep; break;
        default: return;
      }
      e.preventDefault();
      await ipcRenderer.invoke('move-window', { dx, dy });
      return;
    }

    // Toggle maximize: Ctrl+Alt+M
    if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      await ipcRenderer.invoke('toggle-maximize');
      return;
    }

    // Snapping: Ctrl+Alt + number keys 1..5
    if (e.ctrlKey && e.altKey && !e.shiftKey) {
      switch (e.key) {
        case '1': await ipcRenderer.invoke('snap-window', 'left'); e.preventDefault(); return;
        case '2': await ipcRenderer.invoke('snap-window', 'right'); e.preventDefault(); return;
        case '3': await ipcRenderer.invoke('snap-window', 'top'); e.preventDefault(); return;
        case '4': await ipcRenderer.invoke('snap-window', 'bottom'); e.preventDefault(); return;
        case '5': await ipcRenderer.invoke('snap-window', 'center'); e.preventDefault(); return;
      }
    }

      // Additional snap shortcuts (left 1/4 and left 1/3) using number keys 6 & 7
      if (e.ctrlKey && e.altKey && !e.shiftKey) {
        try {
          switch (e.key) {
            case '6': {
              const enabled = await ipcRenderer.invoke('get-setting', 'leftQuarterShortcut');
              if (enabled) { await ipcRenderer.invoke('snap-window', 'left-quarter'); e.preventDefault(); }
              return;
            }
            case '7': {
              const enabled = await ipcRenderer.invoke('get-setting', 'leftThirdShortcut');
              if (enabled) { await ipcRenderer.invoke('snap-window', 'left-third'); e.preventDefault(); }
              return;
            }
          }
        } catch (err) { /* ignore */ }
      }
  });
});
