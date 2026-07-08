const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openImage: (filePath) => ipcRenderer.send('open-image', filePath),
  openInFolder: (filePath) => ipcRenderer.send('open-in-folder', filePath),
  startScan: (folderPath, keywords) => ipcRenderer.send('start-scan', { folderPath, keywords }),
  stopScan: () => ipcRenderer.send('stop-scan'),
  
  // Listeners
  onScanInfo: (callback) => ipcRenderer.on('scan-info', (event, value) => callback(value)),
  onScanProgress: (callback) => ipcRenderer.on('scan-progress', (event, value) => callback(value)),
  onScanMatch: (callback) => ipcRenderer.on('scan-match', (event, value) => callback(value)),
  onScanDone: (callback) => ipcRenderer.on('scan-done', (event, value) => callback(value)),
  onScanError: (callback) => ipcRenderer.on('scan-error', (event, value) => callback(value)),

  // Cleanup listeners
  removeListeners: () => {
    ipcRenderer.removeAllListeners('scan-info');
    ipcRenderer.removeAllListeners('scan-progress');
    ipcRenderer.removeAllListeners('scan-match');
    ipcRenderer.removeAllListeners('scan-done');
    ipcRenderer.removeAllListeners('scan-error');
  }
});
