const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');

// Set app name for menu items (uses productName from package.json)
app.setName('Markdown Reader');

// File watching management
const fileWatchers = new Map(); // Map of filePath -> watcher

// Load markdown parsing modules in main process
let marked;
let Prism;

try {
  marked = require('marked');
  Prism = require('prismjs');
  
  // Load all available Prism.js languages automatically
  const loadLanguages = require('prismjs/components/');
  loadLanguages(); // This loads ALL available languages
  
  console.log('Marked and Prism.js loaded in main process with all languages');
} catch (error) {
  console.warn('Could not load marked or Prism.js in main process:', error.message);
}

// Simple markdown parser fallback
function simpleMarkdownParse(markdown) {
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\* (.*)$/gim, '<li>$1</li>')
    .replace(/\n/gim, '<br>');
}

// Simple HTML sanitizer (basic XSS protection)
function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

let mainWindow = null;

// Helper function to format file paths like VS Code (replace home with ~/)
function formatFilePathForMenu(filePath) {
  const homeDir = os.homedir();
  if (filePath.startsWith(homeDir)) {
    return filePath.replace(homeDir, '~');
  }
  return filePath;
}

// Global variable to store current tab list for menu
let currentTabList = [];

// Function to create tab menu items
function createTabMenuItems(win, hasActiveWindow) {
  if (!hasActiveWindow || !currentTabList || currentTabList.length === 0) {
    return [{
      label: 'No Open Tabs',
      enabled: false
    }];
  }
  
  return currentTabList.slice(0, 9).map((tab, index) => ({
    label: `${index + 1}. ${tab.title}`,
    accelerator: `CmdOrCtrl+${index + 1}`,
    enabled: hasActiveWindow,
    click: () => {
      if (!hasActiveWindow || !win || win.isDestroyed()) return;
      win.webContents.send('menu-switch-to-tab', index);
    }
  }));
}

function createMenuTemplate(win, hasActiveWindow = true) {
  // Build recent files submenu
  const recentFilesSubmenu = currentRecentFiles.length > 0 
    ? currentRecentFiles.map(filePath => ({
        label: formatFilePathForMenu(filePath),
        enabled: hasActiveWindow,
        click: async () => {
          if (!hasActiveWindow || !win || win.isDestroyed()) return;
          try {
            const content = await fs.readFile(filePath, 'utf8');
            win.webContents.send('open-file-from-system', { content, filePath });
          } catch (error) {
            console.error('Error opening recent file:', error);
          }
        }
      })).concat([
        { type: 'separator' },
        {
          label: 'Clear Recent Files',
          click: () => {
            currentRecentFiles = [];
            win.webContents.send('clear-recent-files');
            updateApplicationMenu();
          }
        }
      ])
    : [
        {
          label: 'No Recent Files',
          enabled: false
        }
      ];

  return [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+N',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-new-tab');
          }
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            createWindow();
          }
        },
        { type: 'separator' },
        {
          label: 'Open File(s)...',
          accelerator: 'CmdOrCtrl+O',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-open-file');
          }
        },
        {
          label: 'Recent Files',
          submenu: recentFilesSubmenu
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-open-settings');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-copy');
          }
        },
        {
          label: 'Copy All',
          accelerator: 'CmdOrCtrl+Shift+C',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-copy-all');
          }
        },
        { type: 'separator' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+D',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-toggle-theme');
          }
        },
        {
          label: 'Table of Contents',
          accelerator: 'CmdOrCtrl+T',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-toggle-toc');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggledevtools' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        // Tab list will be dynamically populated
        ...createTabMenuItems(win, hasActiveWindow),
        { type: 'separator' },
        {
          label: 'Close All Tabs',
          accelerator: 'CmdOrCtrl+Shift+W',
          enabled: hasActiveWindow,
          click: () => {
            if (!hasActiveWindow || !win || win.isDestroyed()) return;
            win.webContents.send('menu-close-all-tabs');
          }
        }
      ]
    }
  ];
}

// File watching functions
function startWatchingFile(filePath) {
  // Don't watch the same file twice
  if (fileWatchers.has(filePath)) {
    return;
  }

  try {
    // Use fs.watchFile for more reliable cross-platform watching
    const watcher = fsSync.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
      // Check if file was actually modified (mtime changed)
      if (curr.mtime > prev.mtime) {
        console.log(`File changed: ${filePath}`);
        // Notify renderer process about file change
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('file-changed', filePath);
        }
      }
    });

    fileWatchers.set(filePath, watcher);
    console.log(`Started watching file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to watch file ${filePath}:`, error);
  }
}

function stopWatchingFile(filePath) {
  if (fileWatchers.has(filePath)) {
    fsSync.unwatchFile(filePath);
    fileWatchers.delete(filePath);
    console.log(`Stopped watching file: ${filePath}`);
  }
}

function stopWatchingAllFiles() {
  for (const filePath of fileWatchers.keys()) {
    fsSync.unwatchFile(filePath);
  }
  fileWatchers.clear();
  console.log('Stopped watching all files');
}

function updateApplicationMenu() {
  // Check if there are any active windows
  const activeWindows = BrowserWindow.getAllWindows().filter(win => !win.isDestroyed());
  const hasActiveWindow = activeWindows.length > 0;
  const focusedWindow = BrowserWindow.getFocusedWindow();
  
  // Use focused window if available, otherwise use any active window
  const referenceWindow = focusedWindow || activeWindows[0] || mainWindow;
  
  if (referenceWindow) {
    const template = createMenuTemplate(referenceWindow, hasActiveWindow);
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

function createWindow(windowOptions = {}) {
  const defaultOptions = {
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  };
  
  // Merge provided options with defaults
  const options = { ...defaultOptions, ...windowOptions };
  
  const win = new BrowserWindow(options);

  // Set as main window only if it's the first window
  if (!mainWindow) {
    mainWindow = win;
  }
  
  const template = createMenuTemplate(win, true);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Add window event handlers to update menu state
  win.on('closed', () => {
    // Update menu when window is closed
    updateApplicationMenu();
    if (win === mainWindow) {
      // Find another window to be the main window
      const remainingWindows = BrowserWindow.getAllWindows().filter(w => w !== win && !w.isDestroyed());
      mainWindow = remainingWindows.length > 0 ? remainingWindows[0] : null;
    }
  });
  
  win.on('focus', () => {
    // Update menu when window gains focus
    updateApplicationMenu();
  });
  
  // Handle files passed as command line arguments (Windows/Linux)
  const args = process.argv;
  if (args.length > 1) {
    // Find all markdown files in arguments
    const markdownFiles = args.slice(1).filter(arg => 
      (arg.endsWith('.md') || arg.endsWith('.markdown')) && !arg.startsWith('-')
    );
    
    if (markdownFiles.length > 0) {
      // Wait for the window to load, then open all files
      win.webContents.once('did-finish-load', () => {
        markdownFiles.forEach(filePath => {
          openFileInWindow(win, filePath);
        });
      });
    }
  }
  
  return win;
}

// Function to open a file in the window
async function openFileInWindow(win, filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    win.webContents.send('open-file-from-system', { content, filePath });
  } catch (error) {
    console.error('Error opening file from system:', error);
  }
}

// Store files to open if app isn't ready yet
let filesToOpen = [];

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  // Show a non-blocking notification
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available and will be downloaded in the background.`,
    detail: 'You will be notified when the update is ready to install.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
  log_message += ` - Downloaded ${Math.round(progressObj.percent)}%`;
  log_message += ` (${progressObj.transferred}/${progressObj.total})`;
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  
  // Show restart dialog
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: `Update ${info.version} has been downloaded and is ready to install.`,
    detail: 'The application will restart to apply the update.',
    buttons: ['Restart Now', 'Restart Later']
  }).then((result) => {
    if (result.response === 0) {
      // User chose to restart now
      autoUpdater.quitAndInstall();
    }
    // If user chose "Later", the update will be applied on next app restart
  });
});

app.whenReady().then(() => {
  createWindow();
  
  // Check for updates (but not in development)
  if (!app.isPackaged) {
    console.log('Skipping auto-updater in development mode');
  } else {
    // Check for updates after 5 seconds to allow app to fully load
    setTimeout(() => {
      console.log('Checking for updates...');
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }
  
  // Open files if any were requested before app was ready
  if (filesToOpen.length > 0) {
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', () => {
        filesToOpen.forEach(filePath => {
          openFileInWindow(mainWindow, filePath);
        });
        filesToOpen = [];
      });
    } else {
      filesToOpen.forEach(filePath => {
        openFileInWindow(mainWindow, filePath);
      });
      filesToOpen = [];
    }
  }
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Clean up file watchers before closing
  stopWatchingAllFiles();
  
  // Update menu to disable items when no windows are open
  updateApplicationMenu();
  
  if (process.platform !== 'darwin') app.quit();
});

// Handle file opening on macOS
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  
  if (!app.isReady()) {
    // Store the file path and open it when app is ready
    if (!filesToOpen.includes(filePath)) {
      filesToOpen.push(filePath);
    }
    return;
  }
  
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  if (win) {
    if (win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', () => {
        openFileInWindow(win, filePath);
      });
    } else {
      openFileInWindow(win, filePath);
    }
  }
});

// Handle second instance (Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      
      // Check if markdown files were passed
      const markdownFiles = commandLine.slice(1).filter(arg => 
        (arg.endsWith('.md') || arg.endsWith('.markdown')) && !arg.startsWith('-')
      );
      
      if (markdownFiles.length > 0) {
        markdownFiles.forEach(filePath => {
          openFileInWindow(win, filePath);
        });
      }
    }
  });
}

ipcMain.handle('get-recent-files', async () => {
  // This will be handled by the renderer, just return empty for now
  return [];
});

ipcMain.handle('open-recent-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) {
      win.webContents.send('open-file-from-system', { content, filePath });
    }
    return { success: true };
  } catch (error) {
    console.error('Error opening recent file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-markdown-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
  });
  if (canceled || !filePaths.length) return { canceled: true };
  
  // Read all selected files
  const files = [];
  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      files.push({ content, filePath });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return { canceled: false, files };
});

// Store current recent files for menu
let currentRecentFiles = [];

ipcMain.handle('update-recent-files-menu', async (event, recentFiles) => {
  currentRecentFiles = recentFiles;
  updateApplicationMenu();
  return { success: true };
});

ipcMain.handle('read-markdown-file', async (event, filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  return { ok: true, content, filePath };
});

ipcMain.handle('parse-markdown', async (event, markdown) => {
  try {
    let html;
    
    if (marked && Prism) {
      // Configure marked with Prism.js syntax highlighting
      const renderer = new marked.Renderer();
      
      renderer.code = function(code, language) {
        if (language && Prism.languages[language]) {
          const highlighted = Prism.highlight(code, Prism.languages[language], language);
          return `<pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
        } else {
          // Fallback for unknown languages
          return `<pre><code>${code}</code></pre>`;
        }
      };
      
      marked.setOptions({
        renderer: renderer,
        breaks: true,
        gfm: true
      });
      
      html = marked.parse ? marked.parse(markdown) : marked(markdown);
    } else if (marked) {
      // Use marked without syntax highlighting
      html = marked.parse ? marked.parse(markdown) : marked(markdown);
    } else {
      // Use simple fallback parser
      html = simpleMarkdownParse(markdown);
    }
    
    // Simple sanitization
    html = sanitizeHtml(html);
    
    return html;
  } catch (error) {
    console.error('Error parsing markdown:', error.message);
    return simpleMarkdownParse(markdown);
  }
});

// File watching IPC handlers
ipcMain.handle('start-watching-file', async (event, filePath) => {
  try {
    startWatchingFile(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error starting file watch:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-watching-file', async (event, filePath) => {
  try {
    stopWatchingFile(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error stopping file watch:', error);
    return { success: false, error: error.message };
  }
});

// Copy functionality IPC handlers
ipcMain.handle('copy-to-clipboard', async (event, text) => {
  try {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return { success: false, error: error.message };
  }
});

// Handle new window creation
ipcMain.handle('create-new-window', async () => {
  createWindow();
  return { success: true };
});

// Handle tab list updates for Window menu
ipcMain.handle('update-tab-list', async (event, tabList) => {
  currentTabList = tabList;
  updateApplicationMenu();
  return { success: true };
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { available: false, message: 'Updates not available in development mode' };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    return { 
      available: result ? true : false, 
      updateInfo: result ? result.updateInfo : null 
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { available: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  if (!app.isPackaged) {
    return { success: false, message: 'Updates not available in development mode' };
  }
  
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error downloading update:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('quit-and-install', async () => {
  if (!app.isPackaged) {
    return { success: false, message: 'Updates not available in development mode' };
  }
  
  autoUpdater.quitAndInstall();
  return { success: true };
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});
