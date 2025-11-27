const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getLinks: () => ipcRenderer.invoke('get-links'),
  addLink: (link) => ipcRenderer.invoke('add-link', link),
  deleteLink: (id) => ipcRenderer.invoke('delete-link', id),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  openLink: (url) => ipcRenderer.invoke('open-link', url)
});

// Window management helpers
contextBridge.exposeInMainWorld('windowManager', {
  getBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setBounds: (bounds) => ipcRenderer.invoke('set-window-bounds', bounds)
});
