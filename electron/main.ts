import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#080b12',
    title: 'Crow6 Developer Preview',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('project:open-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Open a local project',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const projectPath = result.filePaths[0];
  const tree = await readDirectoryTree(projectPath);

  return {
    name: path.basename(projectPath),
    path: projectPath,
    tree,
  };
});

ipcMain.handle('project:read-file', async (_event, filePath: string) => {
  if (!filePath) {
    return null;
  }

  const normalizedPath = path.normalize(filePath);
  const fileStats = await fs.stat(normalizedPath);

  if (!fileStats.isFile() || fileStats.size > 512 * 1024) {
    return {
      path: normalizedPath,
      content: '',
      error: 'File is too large or not readable as a preview.',
    };
  }

  return {
    path: normalizedPath,
    content: await fs.readFile(normalizedPath, 'utf8'),
  };
});

ipcMain.handle('project:search-files', async (_event, rootPath: string, query: string) => {
  const trimmedQuery = query.trim();

  if (!rootPath || trimmedQuery.length < 2) {
    return [];
  }

  const files = await collectSearchableFiles(path.normalize(rootPath));
  const normalizedQuery = trimmedQuery.toLowerCase();
  const results: SearchResult[] = [];

  for (const filePath of files) {
    if (results.length >= 40) {
      break;
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split(/\r?\n/);

      for (let index = 0; index < lines.length && results.length < 40; index += 1) {
        const line = lines[index];
        if (line.toLowerCase().includes(normalizedQuery)) {
          results.push({
            filePath,
            line: index + 1,
            preview: line.trim().slice(0, 180),
          });
        }
      }
    } catch {
      continue;
    }
  }

  return results;
});

type FileTreeNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
};

type SearchResult = {
  filePath: string;
  line: number;
  preview: string;
};

const ignoredNames = new Set([
  '.git',
  'node_modules',
  'dist',
  'dist-electron',
  'build',
  '.next',
  '.turbo',
  'coverage',
]);

const searchableExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
]);

async function readDirectoryTree(rootPath: string, depth = 0): Promise<FileTreeNode[]> {
  if (depth > 3) {
    return [];
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const visibleEntries = entries
    .filter((entry) => !ignoredNames.has(entry.name))
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    .slice(0, 80);

  const nodes = await Promise.all(
    visibleEntries.map(async (entry) => {
      const entryPath = path.join(rootPath, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: entryPath,
          type: 'directory' as const,
          children: await readDirectoryTree(entryPath, depth + 1),
        };
      }

      return {
        name: entry.name,
        path: entryPath,
        type: 'file' as const,
      };
    }),
  );

  return nodes;
}

async function collectSearchableFiles(rootPath: string, depth = 0): Promise<string[]> {
  if (depth > 5) {
    return [];
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (ignoredNames.has(entry.name) || files.length >= 400) {
      continue;
    }

    const entryPath = path.join(rootPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSearchableFiles(entryPath, depth + 1)));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!searchableExtensions.has(extension)) {
      continue;
    }

    const fileStats = await fs.stat(entryPath);
    if (fileStats.size <= 256 * 1024) {
      files.push(entryPath);
    }
  }

  return files.slice(0, 400);
}
