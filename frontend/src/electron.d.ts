/**
 * TypeScript declarations for Electron IPC bridge
 */

interface ElectronAPI {
  showNotification: (title: string, body: string) => void;
  updateTrayStatus: (status: string) => void;
  getPlatform: () => Promise<{ platform: string; isElectron: boolean }>;
  onNotification: (callback: (data: any) => void) => () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
