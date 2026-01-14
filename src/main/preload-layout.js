const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('layoutAPI', {
  onLayoutSnapshot: (cb) => ipcRenderer.on('window-layout-snapshot', (_evt, payload) => cb(payload)),
  requestLayoutSnapshot: () => ipcRenderer.invoke('get-window-layout-snapshot'),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  readLocale: (lang) => ipcRenderer.invoke('read-locale', lang),
  onSettingChanged: (cb) => {
    ipcRenderer.on('setting-changed', (_evt, key, value) => cb(key, value));
  }
});
