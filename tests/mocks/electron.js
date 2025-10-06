// Mock Electron module for testing
const EventEmitter = require('events');

const mockWebContents = {
  send: jest.fn(),
  once: jest.fn(),
  on: jest.fn(),
  loadFile: jest.fn(),
  isDestroyed: jest.fn(() => false),
};

const mockBrowserWindow = {
  isDestroyed: jest.fn(() => false),
  webContents: mockWebContents,
  loadFile: jest.fn(),
  focus: jest.fn(),
  setMenuBarVisibility: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
};

const mockDialog = {
  showOpenDialog: jest.fn(),
  showMessageBox: jest.fn(),
};

const mockMenu = {
  setApplicationMenu: jest.fn(),
  buildFromTemplate: jest.fn(() => mockMenu),
};

const mockIpcMain = new EventEmitter();
mockIpcMain.handle = jest.fn();

const mockApp = new EventEmitter();
mockApp.whenReady = jest.fn(() => Promise.resolve());
mockApp.quit = jest.fn();
mockApp.isReady = jest.fn(() => true);
mockApp.requestSingleInstanceLock = jest.fn(() => true);
mockApp.setName = jest.fn(); // Add setName method for app name setting

const mockIpcRenderer = new EventEmitter();
mockIpcRenderer.invoke = jest.fn();

module.exports = {
  app: mockApp,
  BrowserWindow: jest.fn(() => mockBrowserWindow),
  ipcMain: mockIpcMain,
  ipcRenderer: mockIpcRenderer,
  dialog: mockDialog,
  Menu: mockMenu,
  shell: {
    openExternal: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  // Export mock instances for testing
  __mockWebContents: mockWebContents,
  __mockBrowserWindow: mockBrowserWindow,
  __mockDialog: mockDialog,
  __mockMenu: mockMenu,
  __mockIpcMain: mockIpcMain,
  __mockIpcRenderer: mockIpcRenderer,
  __mockApp: mockApp,
};
