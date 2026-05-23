const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBatteryStats: () => ipcRenderer.invoke('battery:get-stats'),
  getStorageStats: () => ipcRenderer.invoke('storage:get-stats'),
  getCountdownTargetDate: () => ipcRenderer.invoke('countdown:get-target-date'),
  closeWindow: () => ipcRenderer.invoke('app:close'),
});
