/// <reference types="vite/client" />

type Crow6Api = {
  openProject: () => Promise<{
    name: string;
    path: string;
    tree: import('./data').TreeNode[];
  } | null>;
  readFile: (filePath: string) => Promise<{
    path: string;
    content: string;
    error?: string;
  } | null>;
  searchFiles: (rootPath: string, query: string) => Promise<Array<{
    filePath: string;
    line: number;
    preview: string;
  }>>;
};

declare global {
  interface Window {
    crow6?: Crow6Api;
  }
}

export {};
