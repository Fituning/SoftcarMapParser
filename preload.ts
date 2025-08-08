// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openMapDialog: () => ipcRenderer.invoke('dialog:openMap'),
  parseMapFile: (filePath: string) => ipcRenderer.invoke('parse-map', filePath),
});
