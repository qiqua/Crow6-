import { contextBridge, ipcRenderer } from 'electron';

const crow6 = {
  openProject: () => ipcRenderer.invoke('project:open-directory'),
  readFile: (filePath: string) => ipcRenderer.invoke('project:read-file', filePath),
  searchFiles: (rootPath: string, query: string) => ipcRenderer.invoke('project:search-files', rootPath, query),
};

contextBridge.exposeInMainWorld('crow6', crow6);

export type Crow6Api = typeof crow6;
