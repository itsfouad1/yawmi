const { app, BrowserWindow, Notification, ipcMain } = require('electron');
const path = require('node:path');
const createWindow = () => {
  const win = new BrowserWindow({ width: 1440, height: 920, minWidth: 800, minHeight: 650, backgroundColor: '#10111b', title: 'يومي | مساحة إنجازك', webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.cjs') } });
  if (app.isPackaged) win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  else win.loadURL('http://127.0.0.1:5173');
};
ipcMain.handle('yawmi:notify', (_event, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body }).show();
});
app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('com.yawmi.desktop');
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
