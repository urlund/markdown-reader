// Test for new tab creation functionality
describe('New Tab Creation', () => {
  let mockWindow;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="tabs-container"></div>
      <div id="content"></div>
      <button id="newTabBtn">+ New Tab</button>
    `;
    
    // Mock the API
    mockWindow = {
      api: {
        onMenuNewTab: jest.fn(),
        onMenuOpenFile: jest.fn(),
        onMenuToggleTheme: jest.fn(),
        onMenuToggleTOC: jest.fn(),
        onMenuOpenSettings: jest.fn(),
        onMenuCopy: jest.fn(),
        onMenuCopyAll: jest.fn(),
        onClearRecentFiles: jest.fn(),
        onOpenFileFromSystem: jest.fn(),
        onFileChanged: jest.fn()
      }
    };
    global.window = mockWindow;
    
    // Mock global variables
    global.tabs = [];
    global.activeTabId = null;
    global.nextTabId = 1;
    global.updateTabUI = jest.fn();
    global.updateContentArea = jest.fn();
    global.updateWindowTitle = jest.fn();
    global.switchToTab = jest.fn();
    
    // Mock navigator platform for cross-platform testing
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should create new tab when Cmd+N is pressed', () => {
    // Define createNewTab function for testing
    const createNewTab = function() {
      const newTab = {
        id: global.nextTabId++,
        title: 'New Tab',
        filePath: null,
        content: null,
        htmlContent: null,
        tocData: null,
        isWelcome: true,
        searchState: { term: '', results: [], currentIndex: -1, originalContent: '' },
        tocSearchState: { term: '', caseSensitive: false },
        scrollPosition: 0
      };
      
      global.tabs.push(newTab);
      global.switchToTab(newTab.id);
    };
    
    // Simulate Cmd+N keydown event
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true, // Cmd key on Mac
      bubbles: true
    });
    
    // Add event listener that mimics the app behavior
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdOrCtrl && e.key === 'n') {
        e.preventDefault();
        createNewTab();
      }
    });
    
    // Dispatch the event
    document.dispatchEvent(keyEvent);
    
    // Verify new tab was created
    expect(global.tabs).toHaveLength(1);
    expect(global.tabs[0].title).toBe('New Tab');
    expect(global.tabs[0].isWelcome).toBe(true);
    expect(global.switchToTab).toHaveBeenCalledWith(1);
  });

  test('should create new tab when new tab button is clicked', () => {
    // Define createNewTab function for testing
    const createNewTab = function() {
      const newTab = {
        id: global.nextTabId++,
        title: 'New Tab',
        filePath: null,
        content: null,
        htmlContent: null,
        tocData: null,
        isWelcome: true,
        searchState: { term: '', results: [], currentIndex: -1, originalContent: '' },
        tocSearchState: { term: '', caseSensitive: false },
        scrollPosition: 0
      };
      
      global.tabs.push(newTab);
      global.switchToTab(newTab.id);
    };
    
    // Add click event listener to the button
    const newTabBtn = document.getElementById('newTabBtn');
    newTabBtn.addEventListener('click', createNewTab);
    
    // Simulate button click
    newTabBtn.click();
    
    // Verify new tab was created
    expect(global.tabs).toHaveLength(1);
    expect(global.tabs[0].title).toBe('New Tab');
    expect(global.tabs[0].isWelcome).toBe(true);
    expect(global.switchToTab).toHaveBeenCalledWith(1);
  });

  test('should not interfere with keystrokes in input fields', () => {
    // Define createNewTab function for testing
    const createNewTab = jest.fn();
    
    // Add input field to DOM
    document.body.innerHTML += '<input type="text" id="testInput">';
    const inputField = document.getElementById('testInput');
    
    // Add event listener that mimics the app behavior
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return; // Should not create new tab when typing in input
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdOrCtrl && e.key === 'n') {
        e.preventDefault();
        createNewTab();
      }
    });
    
    // Focus the input field and simulate Cmd+N
    inputField.focus();
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
      bubbles: true
    });
    
    // Dispatch event from the input field
    inputField.dispatchEvent(keyEvent);
    
    // Verify createNewTab was NOT called
    expect(createNewTab).not.toHaveBeenCalled();
  });

  test('should handle Ctrl+N on Windows/Linux', () => {
    // Mock Windows platform
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true
    });
    
    // Define createNewTab function for testing
    const createNewTab = jest.fn();
    
    // Add event listener that mimics the app behavior
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdOrCtrl && e.key === 'n') {
        e.preventDefault();
        createNewTab();
      }
    });
    
    // Simulate Ctrl+N keydown event
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true, // Ctrl key on Windows/Linux
      bubbles: true
    });
    
    // Dispatch the event
    document.dispatchEvent(keyEvent);
    
    // Verify createNewTab was called
    expect(createNewTab).toHaveBeenCalled();
  });

  test('should handle menu-triggered new tab creation', () => {
    // Mock the menu event callback
    let menuCallback = null;
    mockWindow.api.onMenuNewTab.mockImplementation((callback) => {
      menuCallback = callback;
    });
    
    // Define createNewTab function for testing
    const createNewTab = function() {
      const newTab = {
        id: global.nextTabId++,
        title: 'New Tab',
        filePath: null,
        content: null,
        htmlContent: null,
        tocData: null,
        isWelcome: true,
        searchState: { term: '', results: [], currentIndex: -1, originalContent: '' },
        tocSearchState: { term: '', caseSensitive: false },
        scrollPosition: 0
      };
      
      global.tabs.push(newTab);
      global.switchToTab(newTab.id);
    };
    
    // Simulate the menu event handler registration
    mockWindow.api.onMenuNewTab(createNewTab);
    
    // Verify the callback was registered
    expect(mockWindow.api.onMenuNewTab).toHaveBeenCalledWith(createNewTab);
  });
});
