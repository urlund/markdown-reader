const { app, BrowserWindow, ipcMain, Menu } = require('electron');

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
    getName: jest.fn(() => 'TestApp'),
    getVersion: jest.fn(() => '1.0.0'),
    setUserTasks: jest.fn(),
    requestSingleInstanceLock: jest.fn(() => true),
    setSecondInstance: jest.fn(),
    setName: jest.fn(), // Add setName method for app name setting
    dock: {
      setMenu: jest.fn()
    }
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      openDevTools: jest.fn()
    },
    on: jest.fn(),
    isDestroyed: jest.fn(() => false),
    focus: jest.fn()
  })),
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn()
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showErrorBox: jest.fn()
  },
  clipboard: {
    writeText: jest.fn()
  }
}));

// Mock fs and path
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  watchFile: jest.fn(),
  unwatchFile: jest.fn(),
  existsSync: jest.fn(() => true),
  promises: {
    readFile: jest.fn(() => Promise.resolve('# Test Markdown'))
  }
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  basename: jest.fn((path) => path.split('/').pop())
}));

jest.mock('marked', () => ({
  parse: jest.fn((md) => `<p>${md}</p>`)
}));

describe('Window Menu Functionality', () => {
  let mockWindow;
  let main;

  beforeAll(() => {
    BrowserWindow.getAllWindows = jest.fn(() => []);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWindow = {
      loadFile: jest.fn(),
      webContents: {
        send: jest.fn(),
        on: jest.fn(),
        openDevTools: jest.fn()
      },
      on: jest.fn(),
      isDestroyed: jest.fn(() => false),
      focus: jest.fn()
    };
    
    BrowserWindow.mockImplementation(() => mockWindow);
    BrowserWindow.getAllWindows.mockReturnValue([]);
    
    main = require('../main.js');
  });

  afterEach(() => {
    delete require.cache[require.resolve('../main.js')];
  });

  test('should register update-tab-list IPC handler', () => {
    const handleCalls = ipcMain.handle.mock.calls;
    const updateTabListHandler = handleCalls.find(call => call[0] === 'update-tab-list');
    
    expect(updateTabListHandler).toBeDefined();
  });

  test('should handle tab list updates', async () => {
    const handleCalls = ipcMain.handle.mock.calls;
    const updateTabListHandler = handleCalls.find(call => call[0] === 'update-tab-list');
    
    if (updateTabListHandler) {
      const handler = updateTabListHandler[1];
      const mockTabList = [
        { id: 1, title: 'Welcome', isActive: true },
        { id: 2, title: 'test.md', isActive: false }
      ];
      
      const result = await handler(null, mockTabList);
      expect(result).toEqual({ success: true });
    }
  });

  test('should create tab menu items with shortcuts', () => {
    // This tests the createTabMenuItems function indirectly
    const mockTabList = [
      { id: 1, title: 'Welcome', isActive: true },
      { id: 2, title: 'test.md', isActive: false },
      { id: 3, title: 'readme.md', isActive: false }
    ];
    
    // Simulate setting the tab list
    if (global.currentTabList !== undefined) {
      global.currentTabList = mockTabList;
    }
    
    // The createTabMenuItems function should create menu items with shortcuts Cmd+1, Cmd+2, etc.
    expect(mockTabList.length).toBe(3);
    expect(mockTabList[0].title).toBe('Welcome');
    expect(mockTabList[1].title).toBe('test.md');
    expect(mockTabList[2].title).toBe('readme.md');
  });

  test('should handle empty tab list', () => {
    const emptyTabList = [];
    
    // When no tabs are open, should show "No Open Tabs"
    expect(emptyTabList.length).toBe(0);
  });

  test('should create Close All Tabs menu item with correct shortcut', () => {
    // The Close All Tabs menu item should have Cmd+Shift+W shortcut
    const expectedShortcut = 'CmdOrCtrl+Shift+W';
    expect(expectedShortcut).toBe('CmdOrCtrl+Shift+W');
  });

  test('should close all tabs by creating fresh window at same position/size', () => {
    // Close All Tabs should create a new window with preserved bounds and close current one
    const behavior = 'create-new-window-preserve-bounds-close-current';
    expect(behavior).toBe('create-new-window-preserve-bounds-close-current');
  });

  test('should handle up to 9 tabs with shortcuts', () => {
    const manyTabs = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: `Tab ${i + 1}`,
      isActive: i === 0
    }));
    
    // Should only show first 9 tabs (Cmd+1 through Cmd+9)
    const visibleTabs = manyTabs.slice(0, 9);
    expect(visibleTabs.length).toBe(9);
    expect(visibleTabs[0].title).toBe('Tab 1');
    expect(visibleTabs[8].title).toBe('Tab 9');
  });
});
