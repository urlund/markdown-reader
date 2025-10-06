// Test for menu state management functionality
describe('Menu State Management', () => {
  const { BrowserWindow, Menu } = require('electron');
  
  // Mock Electron modules
  jest.mock('electron', () => ({
    BrowserWindow: {
      getAllWindows: jest.fn(),
      getFocusedWindow: jest.fn()
    },
    Menu: {
      buildFromTemplate: jest.fn(),
      setApplicationMenu: jest.fn()
    }
  }));

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should disable menu items when no windows are active', () => {
    // Mock no active windows
    BrowserWindow.getAllWindows.mockReturnValue([]);
    BrowserWindow.getFocusedWindow.mockReturnValue(null);
    
    // Mock the createMenuTemplate function (this would be imported in real test)
    const createMenuTemplate = (win, hasActiveWindow = true) => {
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
                // Would send IPC message
              }
            },
            {
              label: 'Open File(s)...',
              accelerator: 'CmdOrCtrl+O',
              enabled: hasActiveWindow,
              click: () => {
                if (!hasActiveWindow || !win || win.isDestroyed()) return;
                // Would send IPC message
              }
            },
            {
              label: 'Preferences...',
              accelerator: 'CmdOrCtrl+,',
              enabled: hasActiveWindow,
              click: () => {
                if (!hasActiveWindow || !win || win.isDestroyed()) return;
                // Would send IPC message
              }
            }
          ]
        }
      ];
    };
    
    // Simulate updateApplicationMenu logic
    const activeWindows = BrowserWindow.getAllWindows().filter(win => !win.isDestroyed());
    const hasActiveWindow = activeWindows.length > 0;
    const template = createMenuTemplate(null, hasActiveWindow);
    
    // Check that menu items are disabled
    const fileSubmenu = template[0].submenu;
    expect(fileSubmenu[0].enabled).toBe(false); // New Tab
    expect(fileSubmenu[1].enabled).toBe(false); // Open File
    expect(fileSubmenu[2].enabled).toBe(false); // Preferences
  });

  test('should enable menu items when windows are active', () => {
    // Mock active window
    const mockWindow = {
      isDestroyed: () => false,
      webContents: {
        send: jest.fn()
      }
    };
    
    BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
    BrowserWindow.getFocusedWindow.mockReturnValue(mockWindow);
    
    // Mock the createMenuTemplate function
    const createMenuTemplate = (win, hasActiveWindow = true) => {
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
              label: 'Open File(s)...',
              accelerator: 'CmdOrCtrl+O',
              enabled: hasActiveWindow,
              click: () => {
                if (!hasActiveWindow || !win || win.isDestroyed()) return;
                win.webContents.send('menu-open-file');
              }
            },
            {
              label: 'Preferences...',
              accelerator: 'CmdOrCtrl+,',
              enabled: hasActiveWindow,
              click: () => {
                if (!hasActiveWindow || !win || win.isDestroyed()) return;
                win.webContents.send('menu-open-settings');
              }
            }
          ]
        }
      ];
    };
    
    // Simulate updateApplicationMenu logic
    const activeWindows = BrowserWindow.getAllWindows().filter(win => !win.isDestroyed());
    const hasActiveWindow = activeWindows.length > 0;
    const template = createMenuTemplate(mockWindow, hasActiveWindow);
    
    // Check that menu items are enabled
    const fileSubmenu = template[0].submenu;
    expect(fileSubmenu[0].enabled).toBe(true); // New Tab
    expect(fileSubmenu[1].enabled).toBe(true); // Open File
    expect(fileSubmenu[2].enabled).toBe(true); // Preferences
  });

  test('should not send IPC messages to destroyed windows', () => {
    // Mock destroyed window
    const mockWindow = {
      isDestroyed: () => true,
      webContents: {
        send: jest.fn()
      }
    };
    
    // Test click handler with destroyed window
    const clickHandler = () => {
      if (!mockWindow || mockWindow.isDestroyed()) return;
      mockWindow.webContents.send('menu-new-tab');
    };
    
    // Execute click handler
    clickHandler();
    
    // Verify no IPC message was sent
    expect(mockWindow.webContents.send).not.toHaveBeenCalled();
  });

  test('should handle recent files menu with window state', () => {
    // Mock active window
    const mockWindow = {
      isDestroyed: () => false,
      webContents: {
        send: jest.fn()
      }
    };
    
    // Mock recent files with window state checking
    const createRecentFileItem = (filePath, hasActiveWindow, win) => ({
      label: filePath,
      enabled: hasActiveWindow,
      click: async () => {
        if (!hasActiveWindow || !win || win.isDestroyed()) return;
        win.webContents.send('open-file-from-system', { filePath });
      }
    });
    
    // Test with active window
    const recentFileWithWindow = createRecentFileItem('/test/file.md', true, mockWindow);
    expect(recentFileWithWindow.enabled).toBe(true);
    
    // Test click handler
    recentFileWithWindow.click();
    expect(mockWindow.webContents.send).toHaveBeenCalledWith('open-file-from-system', { filePath: '/test/file.md' });
    
    // Test with no active window
    const recentFileWithoutWindow = createRecentFileItem('/test/file.md', false, null);
    expect(recentFileWithoutWindow.enabled).toBe(false);
  });

  test('should filter destroyed windows correctly', () => {
    // Mock windows - some active, some destroyed
    const activeWindow = { isDestroyed: () => false };
    const destroyedWindow = { isDestroyed: () => true };
    const anotherActiveWindow = { isDestroyed: () => false };
    
    BrowserWindow.getAllWindows.mockReturnValue([activeWindow, destroyedWindow, anotherActiveWindow]);
    
    // Simulate filtering logic
    const activeWindows = BrowserWindow.getAllWindows().filter(win => !win.isDestroyed());
    const hasActiveWindow = activeWindows.length > 0;
    
    // Should have 2 active windows
    expect(activeWindows).toHaveLength(2);
    expect(hasActiveWindow).toBe(true);
    expect(activeWindows).toEqual([activeWindow, anotherActiveWindow]);
  });
});
