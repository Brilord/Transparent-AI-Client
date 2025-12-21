const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getLinks: () => ipcRenderer.invoke('get-links'),
  addLink: (link) => ipcRenderer.invoke('add-link', link),
  deleteLink: (id) => ipcRenderer.invoke('delete-link', id),
  updateLink: (payload) => ipcRenderer.invoke('update-link', payload),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  resetWindowBounds: () => ipcRenderer.invoke('reset-window-bounds'),
  openLink: (url) => ipcRenderer.invoke('open-link', url)
  ,
  openLinkWithId: (id, url) => ipcRenderer.invoke('open-link', id, url)
  ,
  openChatWindow: () => ipcRenderer.invoke('open-chat-window'),
  closeCurrentWindow: () => ipcRenderer.invoke('close-current-window'),
  getOpenLinkWindows: () => ipcRenderer.invoke('get-open-link-windows'),
  openWorkspace: (workspaceId) => ipcRenderer.invoke('open-workspace', workspaceId),
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
  chooseLinksFile: () => ipcRenderer.invoke('choose-links-file'),
  getDefaultLinksPath: () => ipcRenderer.invoke('get-default-links-file'),
  revealLinksFile: () => ipcRenderer.invoke('reveal-links-file'),
  chooseBackgroundImage: () => ipcRenderer.invoke('choose-background-image'),
  onLinksChanged: (cb) => {
    ipcRenderer.on('links-changed', () => cb());
  },
  // Export / Import / Backup
  exportLinks: () => ipcRenderer.invoke('export-links'),
  importLinks: () => ipcRenderer.invoke('import-links'),
  manualBackup: (keepN) => ipcRenderer.invoke('manual-backup', keepN),
  exportLinksCsv: () => ipcRenderer.invoke('export-links-csv'),
  importLinksCsv: () => ipcRenderer.invoke('import-links-csv'),
  // Link actions
  toggleFavorite: (id) => ipcRenderer.invoke('toggle-favorite', id),
  bulkDelete: (ids) => ipcRenderer.invoke('bulk-delete', ids),
  bulkUpdateTags: (ids, tags, mode = 'replace') => ipcRenderer.invoke('bulk-update-tags', ids, tags, mode),
  setLinkPinned: (id, pinned) => ipcRenderer.invoke('set-link-pinned', id, pinned),
  openInBrowser: (url) => ipcRenderer.invoke('open-link-external', url),
  copyLink: (url) => ipcRenderer.invoke('copy-link', url),
  reorderLinks: (orderedIds) => ipcRenderer.invoke('reorder-links', orderedIds),
  refreshLinkMetadata: (id) => ipcRenderer.invoke('refresh-link-metadata', id),
  refreshLinkHealth: (id) => ipcRenderer.invoke('refresh-link-health', id),
  peekClipboardLink: () => ipcRenderer.invoke('peek-clipboard-link'),
  // Generic settings API
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  onSettingChanged: (cb) => {
    ipcRenderer.on('setting-changed', (evt, key, value) => cb(key, value));
  },
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  onDataCollectionEvent: (cb) => {
    ipcRenderer.on('data-collection-event', (evt, payload) => cb(payload));
  }
});

// Window management helpers
contextBridge.exposeInMainWorld('windowManager', {
  getBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setBounds: (bounds) => ipcRenderer.invoke('set-window-bounds', bounds)
});

// expose additional window controls
contextBridge.exposeInMainWorld('windowActions', {
  move: (dx, dy) => ipcRenderer.invoke('move-window', { dx, dy }),
  toggleMaximize: () => ipcRenderer.invoke('toggle-maximize')
});

// Keybindings for main renderer window
window.addEventListener('DOMContentLoaded', () => {
  const centerWindow = async () => {
    const bounds = await ipcRenderer.invoke('get-window-bounds');
    const workArea = await ipcRenderer.invoke('get-window-work-area');
    if (!bounds || !workArea) return;
    const width = Math.max(1, Math.min(bounds.width, workArea.width));
    const height = Math.max(1, Math.min(bounds.height, workArea.height));
    const x = Math.round(workArea.x + (workArea.width - width) / 2);
    const y = Math.round(workArea.y + (workArea.height - height) / 2);
    await ipcRenderer.invoke('set-window-bounds', { ...bounds, x, y, width, height });
  };

  document.addEventListener('keydown', async (e) => {
    // Center window: Ctrl+Alt+C
    if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      await centerWindow();
      return;
    }

    // Reset window bounds: Ctrl+Alt+R
    if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      await ipcRenderer.invoke('reset-window-bounds');
      return;
    }

    // Resize: Ctrl+Alt + Arrow
    if (e.ctrlKey && e.altKey && !e.shiftKey) {
      const step = 20;
      const bounds = await ipcRenderer.invoke('get-window-bounds');
      if (!bounds) return;
      switch (e.key) {
        case 'ArrowLeft': bounds.width = Math.max(1, bounds.width - step); break;
        case 'ArrowRight': bounds.width = bounds.width + step; break;
        case 'ArrowUp': bounds.height = Math.max(1, bounds.height - step); break;
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

  });
});
