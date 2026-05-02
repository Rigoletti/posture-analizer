/**
 * Electron Preload Script
 *
 * Предоставляет безопасный IPC-мост между main и renderer процессами
 * через contextBridge. Renderer НЕ имеет прямого доступа к Node.js API.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Уведомления ────────────────────────────────────────────────────────
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // ─── Трей ───────────────────────────────────────────────────────────────
  updateTrayStatus: (status) => {
    ipcRenderer.send('update-tray-status', status);
  },

  // ─── Платформа ──────────────────────────────────────────────────────────
  getPlatform: () => {
    return ipcRenderer.invoke('get-platform');
  },

  // ─── События от main процесса ───────────────────────────────────────────
  onNotification: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('notification-from-main', handler);
    return () => ipcRenderer.removeListener('notification-from-main', handler);
  },
});
