import { contextBridge, ipcRenderer } from 'electron';

const crow6 = {
  openProject: () => ipcRenderer.invoke('project:open-directory'),
};

contextBridge.exposeInMainWorld('crow6', crow6);

export type Crow6Api = typeof crow6;
