const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openMarkdownFile: () => ipcRenderer.invoke('open-markdown-file'),
  readMarkdownFile: (filePath) => ipcRenderer.invoke('read-markdown-file', filePath),
  parseMarkdown: (md) => ipcRenderer.invoke('parse-markdown', md),
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  openRecentFile: (filePath) => ipcRenderer.invoke('open-recent-file', filePath),
  updateRecentFilesMenu: (recentFiles) => ipcRenderer.invoke('update-recent-files-menu', recentFiles),
  
  // File watching API
  startWatchingFile: (filePath) => ipcRenderer.invoke('start-watching-file', filePath),
  stopWatchingFile: (filePath) => ipcRenderer.invoke('stop-watching-file', filePath),
  onFileChanged: (callback) => ipcRenderer.on('file-changed', callback),
  
  // Copy functionality API
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  
  // Window management API
  createNewWindow: () => ipcRenderer.invoke('create-new-window'),
  updateTabList: (tabList) => ipcRenderer.invoke('update-tab-list', tabList),
  
  // Menu event handlers
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuNewTab: (callback) => ipcRenderer.on('menu-new-tab', callback),
  onMenuToggleTheme: (callback) => ipcRenderer.on('menu-toggle-theme', callback),
  onMenuToggleTOC: (callback) => ipcRenderer.on('menu-toggle-toc', callback),
  onMenuOpenSettings: (callback) => ipcRenderer.on('menu-open-settings', callback),
  onMenuCopy: (callback) => ipcRenderer.on('menu-copy', callback),
  onMenuCopyAll: (callback) => ipcRenderer.on('menu-copy-all', callback),
  onClearRecentFiles: (callback) => ipcRenderer.on('clear-recent-files', callback),
  onOpenFileFromSystem: (callback) => ipcRenderer.on('open-file-from-system', callback),
  onMenuSwitchToTab: (callback) => ipcRenderer.on('menu-switch-to-tab', callback),
  onMenuCloseAllTabs: (callback) => ipcRenderer.on('menu-close-all-tabs', callback),
  
  // Auto-updater API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
