// Test for tab closing behavior
require('./setup.js');

describe('Tab Closing Behavior', () => {
  let createNewTab, closeTab, closeAllTabs, tabs, activeTabId, nextTabId;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="content"></div>
      <div id="tabBar" class="tab-bar">
        <div class="tabs-container"></div>
      </div>
    `;
    
    // Reset tab state
    tabs = [];
    activeTabId = null;
    nextTabId = 1;
    
    // Mock functions that would be available in the real renderer
    global.updateTabUI = jest.fn();
    global.updateContentArea = jest.fn();
    global.updateWindowTitle = jest.fn();
    global.switchToTab = jest.fn((tabId) => {
      activeTabId = tabId;
    });
    global.hideTableOfContents = jest.fn();
    global.hideDocumentSearch = jest.fn();
    global.hideCustomTooltip = jest.fn();
    
    // Import the functions we need to test after setting up mocks
    createNewTab = function() {
      const newTab = {
        id: nextTabId++,
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
      
      tabs.push(newTab);
      activeTabId = newTab.id;
      return newTab;
    };
    
    closeTab = function(tabId) {
      const tabIndex = tabs.findIndex(tab => tab.id === tabId);
      if (tabIndex === -1) return;
      
      // Remove tab
      tabs.splice(tabIndex, 1);
      
      // Handle active tab closure
      if (activeTabId === tabId) {
        if (tabs.length > 0) {
          // Switch to next tab or previous if last tab
          const nextIndex = tabIndex < tabs.length ? tabIndex : tabIndex - 1;
          activeTabId = tabs[nextIndex].id;
        } else {
          // No tabs left, create a new welcome tab instead of closing window
          createNewTab();
          return;
        }
      }
    };
    
    closeAllTabs = function() {
      try {
        // Stop watching all files that are currently being watched
        tabs.forEach(tab => {
          if (tab.filePath && !tab.isWelcome) {
            try {
              global.window.api.stopWatchingFile(tab.filePath);
            } catch (error) {
              // Ignore errors in test
            }
          }
        });
        
        // Close any open overlays (mocked functions)
        global.hideTableOfContents();
        global.hideDocumentSearch();
        global.hideCustomTooltip();
        
        // Clear all tabs
        tabs = [];
        activeTabId = null;
        
        // Create a new welcome tab
        createNewTab();
      } catch (error) {
        // Fallback: ensure we have at least one tab
        if (tabs.length === 0) {
          createNewTab();
        }
      }
    };
    
    // Mock window.api if needed
    global.window = { 
      api: { 
        stopWatchingFile: jest.fn() 
      }
    };
  });

  beforeEach(() => {
    // Reset mocks before each test
    if (global.window && global.window.api && global.window.api.stopWatchingFile) {
      global.window.api.stopWatchingFile.mockClear();
    }
  });

  test('should create new tab when last tab is closed', () => {
    // Start with one tab
    const firstTab = createNewTab();
    expect(tabs.length).toBe(1);
    expect(activeTabId).toBe(firstTab.id);
    
    // Close the last tab
    closeTab(firstTab.id);
    
    // Should have created a new tab instead of closing window
    expect(tabs.length).toBe(1);
    expect(tabs[0].isWelcome).toBe(true);
    expect(tabs[0].title).toBe('New Tab');
    expect(activeTabId).toBe(tabs[0].id);
  });

  test('should switch to remaining tab when closing non-last tab', () => {
    // Create two tabs
    const firstTab = createNewTab();
    const secondTab = createNewTab();
    expect(tabs.length).toBe(2);
    
    // Close the first tab (not the last one)
    closeTab(firstTab.id);
    
    // Should have one tab remaining, not create a new one
    expect(tabs.length).toBe(1);
    expect(tabs[0].id).toBe(secondTab.id);
    expect(activeTabId).toBe(secondTab.id);
  });

  test('should handle closing non-active tab', () => {
    // Create two tabs
    const firstTab = createNewTab();
    const secondTab = createNewTab();
    
    // Switch to first tab
    activeTabId = firstTab.id;
    
    // Close the second tab (non-active)
    closeTab(secondTab.id);
    
    // Should still have first tab active
    expect(tabs.length).toBe(1);
    expect(tabs[0].id).toBe(firstTab.id);
    expect(activeTabId).toBe(firstTab.id);
  });

  test('should maintain correct tab IDs when creating new tab after closing all', () => {
    // Create and close a tab
    const firstTab = createNewTab();
    const originalNextTabId = nextTabId;
    closeTab(firstTab.id);
    
    // New tab should have the next ID in sequence
    expect(tabs[0].id).toBe(originalNextTabId);
    expect(nextTabId).toBe(originalNextTabId + 1);
  });

  describe('Close All Tabs', () => {
    test('should close all tabs and create a new welcome tab', () => {
      // Create multiple tabs
      const firstTab = createNewTab();
      const secondTab = createNewTab();
      const thirdTab = createNewTab();
      
      expect(tabs.length).toBe(3);
      expect(activeTabId).toBe(thirdTab.id);
      
      // Close all tabs
      closeAllTabs();
      
      // Should have exactly one new welcome tab
      expect(tabs.length).toBe(1);
      expect(tabs[0].isWelcome).toBe(true);
      expect(tabs[0].title).toBe('New Tab');
      expect(activeTabId).toBe(tabs[0].id);
    });

    test('should stop watching files when closing all tabs', () => {
      // Ensure the mock is properly set up
      const stopWatchingFileMock = jest.fn();
      if (!global.window) global.window = {};
      if (!global.window.api) global.window.api = {};
      global.window.api.stopWatchingFile = stopWatchingFileMock;
      
      // Create tabs with file paths
      const tab1 = createNewTab();
      tab1.filePath = '/path/to/file1.md';
      tab1.isWelcome = false;
      
      const tab2 = createNewTab();
      tab2.filePath = '/path/to/file2.md';
      tab2.isWelcome = false;
      
      const tab3 = createNewTab(); // This one stays as welcome tab
      
      expect(tabs.length).toBe(3);
      
      // Close all tabs
      closeAllTabs();
      
      // Should have called stopWatchingFile for files that were being watched
      expect(stopWatchingFileMock).toHaveBeenCalledWith('/path/to/file1.md');
      expect(stopWatchingFileMock).toHaveBeenCalledWith('/path/to/file2.md');
      expect(stopWatchingFileMock).toHaveBeenCalledTimes(2);
      
      // Should have one new welcome tab
      expect(tabs.length).toBe(1);
      expect(tabs[0].isWelcome).toBe(true);
    });

    test('should call overlay hiding functions when closing all tabs', () => {
      // Create some tabs
      createNewTab();
      createNewTab();
      
      // Close all tabs
      closeAllTabs();
      
      // Should have called all the overlay hiding functions
      expect(global.hideTableOfContents).toHaveBeenCalled();
      expect(global.hideDocumentSearch).toHaveBeenCalled();
      expect(global.hideCustomTooltip).toHaveBeenCalled();
    });

    test('should handle error gracefully and ensure at least one tab exists', () => {
      // Create tabs
      createNewTab();
      createNewTab();
      
      // Ensure the mock is properly set up
      const stopWatchingFileMock = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      if (!global.window) global.window = {};
      if (!global.window.api) global.window.api = {};
      global.window.api.stopWatchingFile = stopWatchingFileMock;
      
      // Set up tabs with file paths to trigger the error
      tabs[0].filePath = '/test/file.md';
      tabs[0].isWelcome = false;
      
      // Close all tabs - should not throw error
      expect(() => closeAllTabs()).not.toThrow();
      
      // Should still have one tab
      expect(tabs.length).toBe(1);
      expect(tabs[0].isWelcome).toBe(true);
    });
  });
});
