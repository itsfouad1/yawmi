const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const createWindow = () => {
  const win = new BrowserWindow({ width: 1440, height: 920, minWidth: 1024, minHeight: 720, backgroundColor: '#10111b', title: 'يومي | مساحة إنجازك', webPreferences: { contextIsolation: true, nodeIntegration: false } });
  if (app.isPackaged) win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  else win.loadURL('http://127.0.0.1:5173');
};
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
