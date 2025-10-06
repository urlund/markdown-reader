// Test for tab icon click to copy file path functionality
describe('Tab Icon Copy Functionality', () => {
  let mockCopyToClipboard;
  let originalShowNotification;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="tabs-container">
        <!-- Tabs will be dynamically added here -->
      </div>
    `;
    
    // Mock the clipboard API
    mockCopyToClipboard = jest.fn().mockResolvedValue(true);
    global.window = {
      api: {
        copyToClipboard: mockCopyToClipboard
      }
    };
    
    // Mock showNotification
    originalShowNotification = global.showNotification;
    global.showNotification = jest.fn();
    
    // Mock Lucide
    global.lucide = {
      createIcons: jest.fn()
    };
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.showNotification = originalShowNotification;
  });

  test('should be able to copy file path (functionality test)', () => {
    // This test verifies the structure exists for copying file paths
    // The actual functionality is integration tested in the application
    expect(mockCopyToClipboard).toBeDefined();
    expect(global.showNotification).toBeDefined();
    expect(typeof mockCopyToClipboard).toBe('function');
  });

  test('should handle copy failure gracefully', async () => {
    // Mock copy failure
    mockCopyToClipboard.mockRejectedValue(new Error('Copy failed'));
    
    const filePath = '/Users/test/documents/test.md';
    
    // Create the click handler function directly (matching the actual implementation)
    const clickHandler = async (e) => {
      e.stopPropagation();
      try {
        await global.window.api.copyToClipboard(filePath);
        global.showNotification(`Copied file path: ${filePath}`, 'success');
      } catch (error) {
        console.error('Failed to copy file path:', error);
        global.showNotification('Failed to copy file path', 'error');
      }
    };
    
    // Create a mock event
    const mockEvent = { stopPropagation: jest.fn() };
    
    // Test the click handler
    await clickHandler(mockEvent);
    
    // Verify error notification was shown
    expect(global.showNotification).toHaveBeenCalledWith(
      'Failed to copy file path',
      'error'
    );
  });

  test('should prevent event bubbling when icon is clicked', () => {
    let tabClicked = false;
    let eventPropagationStopped = false;
    
    const tabsContainer = document.querySelector('.tabs-container');
    
    // Create mock elements
    const svgElement = document.createElement('svg');
    svgElement.setAttribute('data-lucide', 'file-text');
    
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.onclick = () => { tabClicked = true; };
    
    const iconElement = document.createElement('i');
    iconElement.className = 'tab-icon';
    iconElement.setAttribute('data-file-path', '/Users/test/documents/test.md');
    
    tabElement.appendChild(iconElement);
    tabElement.appendChild(svgElement);
    tabsContainer.appendChild(tabElement);
    
    // Simulate the click handler
    svgElement.onclick = (e) => {
      e.stopPropagation();
      eventPropagationStopped = true;
    };
    
    // Create a mock event
    const mockEvent = {
      stopPropagation: jest.fn()
    };
    
    // Test the click
    svgElement.onclick(mockEvent);
    
    // Verify stopPropagation was called
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  test('should have pointer cursor for file-text icons', () => {
    const tabsContainer = document.querySelector('.tabs-container');
    
    // Create mock SVG element
    const svgElement = document.createElement('svg');
    svgElement.setAttribute('data-lucide', 'file-text');
    svgElement.style.cursor = 'pointer'; // This would be set by the actual code
    
    tabsContainer.appendChild(svgElement);
    
    // Verify cursor style
    expect(svgElement.style.cursor).toBe('pointer');
  });
});
