const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('yawmiNotify', (payload) => ipcRenderer.invoke('yawmi:notify', payload));
