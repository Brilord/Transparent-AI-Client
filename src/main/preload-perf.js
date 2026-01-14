const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('perfAPI', {
  onPerfEvent: (cb) => ipcRenderer.on('perf-event', (evt, payload) => cb(payload)),
  onPerfStats: (cb) => ipcRenderer.on('perf-stats', (evt, payload) => cb(payload)),
  requestPerfHistory: () => ipcRenderer.invoke('perf-history')
});
