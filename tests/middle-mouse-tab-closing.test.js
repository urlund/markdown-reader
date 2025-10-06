// Tests for middle mouse button tab closing functionality
describe('Middle Mouse Button Tab Closing', () => {
  let mockTabsContainer;
  let mockCloseTab;
  
  beforeEach(() => {
    // Set up DOM structure
    document.body.innerHTML = `
      <div class="tab-bar">
        <div class="tabs-container">
          <!-- Tabs will be added dynamically -->
        </div>
      </div>
    `;
    
    mockTabsContainer = document.querySelector('.tabs-container');
    
    // Mock global variables
    global.tabs = [];
    global.activeTabId = null;
    global.nextTabId = 1;
    
    // Mock functions
    global.closeTab = jest.fn();
    global.switchToTab = jest.fn();
    global.getActiveTab = jest.fn();
    global.updateTabUI = jest.fn();
    
    // Store reference to mock for easier access
    mockCloseTab = global.closeTab;
  });
  
  function createMockTab(id, title, isWelcome = false, filePath = null) {
    const tab = {
      id: id,
      title: title,
      isWelcome: isWelcome,
      filePath: filePath
    };
    
    global.tabs.push(tab);
    
    // Create tab element similar to updateTabUI
    const tabElement = document.createElement('div');
    tabElement.className = `tab ${id === global.activeTabId ? 'active' : ''}`;
    tabElement.onclick = () => global.switchToTab(id);
    
    // Add middle mouse button click to close tab
    tabElement.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        e.stopPropagation();
        global.closeTab(id);
      }
    });
    
    tabElement.setAttribute('data-tab-id', id);
    
    const titleElement = document.createElement('span');
    titleElement.className = 'tab-title';
    titleElement.textContent = title;
    tabElement.appendChild(titleElement);
    
    mockTabsContainer.appendChild(tabElement);
    
    return { tab, tabElement };
  }
  
  test('should close tab when middle mouse button is clicked', () => {
    const { tab, tabElement } = createMockTab(1, 'Test Document', false, '/path/to/test.md');
    
    // Create a middle mouse button click event
    const middleClickEvent = new MouseEvent('mousedown', {
      button: 1, // Middle mouse button
      bubbles: true,
      cancelable: true
    });
    
    // Spy on event methods
    const preventDefaultSpy = jest.spyOn(middleClickEvent, 'preventDefault');
    const stopPropagationSpy = jest.spyOn(middleClickEvent, 'stopPropagation');
    
    // Trigger middle mouse button click
    tabElement.dispatchEvent(middleClickEvent);
    
    // Verify closeTab was called with correct tab ID
    expect(mockCloseTab).toHaveBeenCalledWith(1);
    expect(mockCloseTab).toHaveBeenCalledTimes(1);
    
    // Verify event was handled properly
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
  
  test('should not close tab when left mouse button is clicked', () => {
    const { tab, tabElement } = createMockTab(2, 'Another Document', false, '/path/to/another.md');
    
    // Create a left mouse button click event
    const leftClickEvent = new MouseEvent('mousedown', {
      button: 0, // Left mouse button
      bubbles: true,
      cancelable: true
    });
    
    // Trigger left mouse button click
    tabElement.dispatchEvent(leftClickEvent);
    
    // Verify closeTab was NOT called
    expect(mockCloseTab).not.toHaveBeenCalled();
    
    // For left click, we need to manually trigger the onclick handler since
    // mousedown doesn't automatically trigger onclick in JSDOM
    tabElement.click();
    expect(global.switchToTab).toHaveBeenCalledWith(2);
  });
  
  test('should not close tab when right mouse button is clicked', () => {
    const { tab, tabElement } = createMockTab(3, 'Right Click Test', false, '/path/to/rightclick.md');
    
    // Create a right mouse button click event
    const rightClickEvent = new MouseEvent('mousedown', {
      button: 2, // Right mouse button
      bubbles: true,
      cancelable: true
    });
    
    // Trigger right mouse button click
    tabElement.dispatchEvent(rightClickEvent);
    
    // Verify closeTab was NOT called
    expect(mockCloseTab).not.toHaveBeenCalled();
  });
  
  test('should handle middle mouse button on welcome tab', () => {
    const { tab, tabElement } = createMockTab(4, 'Welcome', true);
    
    // Create a middle mouse button click event
    const middleClickEvent = new MouseEvent('mousedown', {
      button: 1, // Middle mouse button
      bubbles: true,
      cancelable: true
    });
    
    // Trigger middle mouse button click
    tabElement.dispatchEvent(middleClickEvent);
    
    // Verify closeTab was called even for welcome tab
    expect(mockCloseTab).toHaveBeenCalledWith(4);
    expect(mockCloseTab).toHaveBeenCalledTimes(1);
  });
  
  test('should handle multiple tabs with middle mouse button correctly', () => {
    // Create multiple tabs
    const { tab: tab1, tabElement: tabElement1 } = createMockTab(5, 'Document 1', false, '/path/to/doc1.md');
    const { tab: tab2, tabElement: tabElement2 } = createMockTab(6, 'Document 2', false, '/path/to/doc2.md');
    const { tab: tab3, tabElement: tabElement3 } = createMockTab(7, 'Document 3', false, '/path/to/doc3.md');
    
    // Create middle mouse button click events
    const middleClick1 = new MouseEvent('mousedown', { button: 1 });
    const middleClick2 = new MouseEvent('mousedown', { button: 1 });
    
    // Click on first and third tabs
    tabElement1.dispatchEvent(middleClick1);
    tabElement3.dispatchEvent(middleClick2);
    
    // Verify closeTab was called for both tabs with correct IDs
    expect(mockCloseTab).toHaveBeenCalledWith(5);
    expect(mockCloseTab).toHaveBeenCalledWith(7);
    expect(mockCloseTab).toHaveBeenCalledTimes(2);
    
    // Verify tab 2 was not affected
    expect(mockCloseTab).not.toHaveBeenCalledWith(6);
  });
  
  test('should not interfere with drag and drop functionality', () => {
    const { tab, tabElement } = createMockTab(8, 'Drag Test', false, '/path/to/dragtest.md');
    
    // Create a custom drag start event (DragEvent not available in test environment)
    const dragStartEvent = new MouseEvent('dragstart', {
      bubbles: true,
      cancelable: true
    });
    
    // Create a middle mouse button event
    const middleClickEvent = new MouseEvent('mousedown', {
      button: 1,
      bubbles: true,
      cancelable: true
    });
    
    // Trigger drag start first
    tabElement.dispatchEvent(dragStartEvent);
    
    // Then trigger middle click
    tabElement.dispatchEvent(middleClickEvent);
    
    // Should still close the tab
    expect(mockCloseTab).toHaveBeenCalledWith(8);
  });
  
  test('should work with keyboard modifiers', () => {
    const { tab, tabElement } = createMockTab(9, 'Modifier Test', false, '/path/to/modifier.md');
    
    // Create middle mouse button click with Ctrl key
    const middleClickWithCtrl = new MouseEvent('mousedown', {
      button: 1,
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    
    // Trigger middle mouse button click with modifier
    tabElement.dispatchEvent(middleClickWithCtrl);
    
    // Should still close the tab regardless of modifiers
    expect(mockCloseTab).toHaveBeenCalledWith(9);
    expect(mockCloseTab).toHaveBeenCalledTimes(1);
  });
  
  test('should handle rapid successive middle clicks', () => {
    // Create multiple tabs
    const { tab: tab1, tabElement: tabElement1 } = createMockTab(10, 'Rapid 1');
    const { tab: tab2, tabElement: tabElement2 } = createMockTab(11, 'Rapid 2');
    const { tab: tab3, tabElement: tabElement3 } = createMockTab(12, 'Rapid 3');
    
    // Rapidly click all tabs
    const middleClick = new MouseEvent('mousedown', { button: 1 });
    
    tabElement1.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
    tabElement2.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
    tabElement3.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
    
    // All tabs should be closed
    expect(mockCloseTab).toHaveBeenCalledWith(10);
    expect(mockCloseTab).toHaveBeenCalledWith(11);
    expect(mockCloseTab).toHaveBeenCalledWith(12);
    expect(mockCloseTab).toHaveBeenCalledTimes(3);
  });
});
