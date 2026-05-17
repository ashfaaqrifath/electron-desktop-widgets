const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBatteryStats: () => ipcRenderer.invoke('battery:get-stats'),
  closeWindow: () => ipcRenderer.invoke('app:close'),
});
