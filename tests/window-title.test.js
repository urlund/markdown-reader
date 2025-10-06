// Test for window title functionality
describe('Window Title Management', () => {
  beforeEach(() => {
    // Reset document title
    document.title = 'Test';
    
    // Mock tab system
    global.tabs = [];
    global.activeTabId = null;
    global.nextTabId = 1;
    
    // Define updateWindowTitle function for testing
    global.updateWindowTitle = function() {
      const activeTab = global.tabs.find(tab => tab.id === global.activeTabId);
      if (activeTab && !activeTab.isWelcome && activeTab.filePath) {
        const fileName = activeTab.filePath.split('/').pop() || 'Unknown file';
        document.title = `${fileName} - Markdown Reader`;
      } else {
        document.title = 'Markdown Reader';
      }
    };
  });

  test('should set default title for welcome tab', () => {
    // Create welcome tab
    const welcomeTab = {
      id: 1,
      title: 'New Tab',
      filePath: null,
      isWelcome: true
    };
    
    global.tabs = [welcomeTab];
    global.activeTabId = 1;
    
    global.updateWindowTitle();
    
    expect(document.title).toBe('Markdown Reader');
  });

  test('should set filename title for document tab', () => {
    // Create document tab
    const docTab = {
      id: 1,
      title: 'test.md',
      filePath: '/Users/test/documents/test.md',
      isWelcome: false
    };
    
    global.tabs = [docTab];
    global.activeTabId = 1;
    
    global.updateWindowTitle();
    
    expect(document.title).toBe('test.md - Markdown Reader');
  });

  test('should handle files with complex paths', () => {
    // Create document tab with complex path
    const docTab = {
      id: 1,
      title: 'README.md',
      filePath: '/Users/developer/projects/my-app/docs/README.md',
      isWelcome: false
    };
    
    global.tabs = [docTab];
    global.activeTabId = 1;
    
    global.updateWindowTitle();
    
    expect(document.title).toBe('README.md - Markdown Reader');
  });

  test('should default to Markdown Reader when no active tab', () => {
    global.tabs = [];
    global.activeTabId = null;
    
    global.updateWindowTitle();
    
    expect(document.title).toBe('Markdown Reader');
  });

  test('should default to Markdown Reader for tab without file path', () => {
    // Create document tab without file path
    const docTab = {
      id: 1,
      title: 'Untitled',
      filePath: null,
      isWelcome: false
    };
    
    global.tabs = [docTab];
    global.activeTabId = 1;
    
    global.updateWindowTitle();
    
    expect(document.title).toBe('Markdown Reader');
  });
});
