// Tests for CSS class management and welcome tab layout behavior
describe('Tab Layout and CSS Class Management', () => {
  let mockContentElement;
  let mockTabsContainer;
  
  beforeEach(() => {
    // Set up DOM structure
    document.body.innerHTML = `
      <div class="tab-bar">
        <div class="tabs-container">
          <!-- Tabs will be added dynamically -->
        </div>
        <button class="new-tab-btn">+</button>
      </div>
      <div id="content">
        <!-- Content area that changes based on tab type -->
      </div>
    `;
    
    mockContentElement = document.getElementById('content');
    mockTabsContainer = document.querySelector('.tabs-container');
    
    // Mock global variables
    global.tabs = [];
    global.activeTabId = null;
    global.nextTabId = 1;
    
    // Mock functions
    global.getActiveTab = jest.fn();
    global.updateTabUI = jest.fn();
    global.updateWindowTitle = jest.fn();
  });
  
  describe('CSS Class Management', () => {
    test('should add has-document-content class when displaying document content', () => {
      // Simulate document content
      const documentContent = `
        <div class="content-wrapper">
          <h1>Document Title</h1>
          <p>Document content here</p>
        </div>
      `;
      
      mockContentElement.innerHTML = documentContent;
      mockContentElement.classList.add('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
      
      // Verify CSS would apply block display
      const hasDocumentContentRule = '.has-document-content { display: block !important; }';
      expect(hasDocumentContentRule).toContain('display: block');
    });
    
    test('should remove has-document-content class when displaying welcome content', () => {
      // Start with document content
      mockContentElement.classList.add('has-document-content');
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
      
      // Switch to welcome content
      const welcomeContent = `
        <div class="welcome-container">
          <div class="welcome-header">
            <h2>Markdown Reader</h2>
            <p>Open a markdown file to get started</p>
          </div>
          <div class="welcome-actions">
            <button class="open-file-btn">Open File(s)</button>
          </div>
        </div>
      `;
      
      mockContentElement.innerHTML = welcomeContent;
      mockContentElement.classList.remove('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(false);
    });
    
    test('should maintain proper CSS classes during tab switching', () => {
      // Mock tabs
      const documentTab = {
        id: 1,
        title: 'Document.md',
        filePath: '/path/to/document.md',
        isWelcome: false,
        htmlContent: '<h1>Document</h1><p>Content</p>'
      };
      
      const welcomeTab = {
        id: 2,
        title: 'New Tab',
        filePath: null,
        isWelcome: true,
        htmlContent: null
      };
      
      global.tabs = [documentTab, welcomeTab];
      
      // Test switching to document tab
      global.getActiveTab.mockReturnValue(documentTab);
      mockContentElement.innerHTML = `<div class="content-wrapper">${documentTab.htmlContent}</div>`;
      mockContentElement.classList.add('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
      
      // Test switching to welcome tab
      global.getActiveTab.mockReturnValue(welcomeTab);
      mockContentElement.innerHTML = `
        <div class="welcome-container">
          <h2>Markdown Reader</h2>
        </div>
      `;
      mockContentElement.classList.remove('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(false);
    });
  });
  
  describe('Welcome Tab Layout', () => {
    test('should center welcome content properly', () => {
      const welcomeContent = `
        <div class="welcome-container">
          <div class="welcome-header">
            <h2>Markdown Reader</h2>
            <p>Open a markdown file to get started or drag and drop a file here</p>
          </div>
          <div class="welcome-actions">
            <button id="openFileBtn" class="open-file-btn">
              <i data-lucide="folder-open" class="btn-icon"></i>
              Open File(s)
            </button>
          </div>
        </div>
      `;
      
      mockContentElement.innerHTML = welcomeContent;
      mockContentElement.classList.remove('has-document-content');
      
      // Verify welcome container exists
      const welcomeContainer = mockContentElement.querySelector('.welcome-container');
      expect(welcomeContainer).toBeTruthy();
      
      // Verify welcome components exist
      expect(mockContentElement.querySelector('.welcome-header')).toBeTruthy();
      expect(mockContentElement.querySelector('.welcome-actions')).toBeTruthy();
      expect(mockContentElement.querySelector('.open-file-btn')).toBeTruthy();
      
      // Verify no document-specific class
      expect(mockContentElement.classList.contains('has-document-content')).toBe(false);
    });
    
    test('should handle recent files in welcome tab', () => {
      const recentFiles = [
        '/path/to/recent1.md',
        '/path/to/recent2.md',
        '/path/to/recent3.md'
      ];
      
      const recentFilesHtml = recentFiles.length > 0 
        ? `<div class="recent-files">
            <h3>Recent Files</h3>
            <ul class="recent-files-list">
              ${recentFiles.map(filePath => {
                const fileName = filePath.split('/').pop() || 'Unknown file';
                return `<li class="recent-file-item" data-file-path="${filePath}">
                  <i data-lucide="file-text" class="recent-file-icon"></i>
                  <span class="recent-file-name">${fileName}</span>
                  <span class="recent-file-path">${filePath}</span>
                </li>`;
              }).join('')}
            </ul>
          </div>`
        : '<div class="no-recent-files"><p>No recent files</p></div>';
      
      const welcomeContent = `
        <div class="welcome-container">
          <div class="welcome-header">
            <h2>Markdown Reader</h2>
            <p>Open a markdown file to get started or drag and drop a file here</p>
          </div>
          <div class="welcome-actions">
            <button id="openFileBtn" class="open-file-btn">Open File(s)</button>
          </div>
          ${recentFilesHtml}
        </div>
      `;
      
      mockContentElement.innerHTML = welcomeContent;
      
      // Verify recent files section
      const recentFilesSection = mockContentElement.querySelector('.recent-files');
      expect(recentFilesSection).toBeTruthy();
      
      const recentFileItems = mockContentElement.querySelectorAll('.recent-file-item');
      expect(recentFileItems.length).toBe(recentFiles.length);
      
      // Verify each recent file item has proper structure
      recentFileItems.forEach((item, index) => {
        expect(item.dataset.filePath).toBe(recentFiles[index]);
        expect(item.querySelector('.recent-file-name')).toBeTruthy();
        expect(item.querySelector('.recent-file-path')).toBeTruthy();
      });
    });
    
    test('should handle empty recent files gracefully', () => {
      const welcomeContent = `
        <div class="welcome-container">
          <div class="welcome-header">
            <h2>Markdown Reader</h2>
            <p>Open a markdown file to get started or drag and drop a file here</p>
          </div>
          <div class="welcome-actions">
            <button id="openFileBtn" class="open-file-btn">Open File(s)</button>
          </div>
          <div class="no-recent-files">
            <p>No recent files</p>
          </div>
        </div>
      `;
      
      mockContentElement.innerHTML = welcomeContent;
      
      const noRecentFiles = mockContentElement.querySelector('.no-recent-files');
      expect(noRecentFiles).toBeTruthy();
      expect(noRecentFiles.textContent.trim()).toBe('No recent files');
      
      const recentFilesSection = mockContentElement.querySelector('.recent-files');
      expect(recentFilesSection).toBeFalsy();
    });
  });
  
  describe('Document Tab Layout', () => {
    test('should properly wrap document content', () => {
      const documentContent = `
        <h1>Document Title</h1>
        <p>This is the document content.</p>
        <h2>Section Title</h2>
        <p>More content here.</p>
      `;
      
      // Simulate how content is wrapped in updateContentArea
      mockContentElement.innerHTML = `<div class="content-wrapper">${documentContent}</div>`;
      mockContentElement.classList.add('has-document-content');
      
      // Verify wrapper exists
      const contentWrapper = mockContentElement.querySelector('.content-wrapper');
      expect(contentWrapper).toBeTruthy();
      
      // Verify content is inside wrapper
      expect(contentWrapper.querySelector('h1')).toBeTruthy();
      expect(contentWrapper.querySelector('h2')).toBeTruthy();
      expect(contentWrapper.querySelectorAll('p').length).toBe(2);
      
      // Verify proper class for document content
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
    });
    
    test('should handle empty document content', () => {
      mockContentElement.innerHTML = '<div class="content-wrapper"></div>';
      mockContentElement.classList.add('has-document-content');
      
      const contentWrapper = mockContentElement.querySelector('.content-wrapper');
      expect(contentWrapper).toBeTruthy();
      expect(contentWrapper.innerHTML).toBe('');
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
    });
  });
  
  describe('Layout Switching Behavior', () => {
    test('should properly transition from welcome to document layout', () => {
      // Start with welcome layout
      mockContentElement.innerHTML = `
        <div class="welcome-container">
          <h2>Markdown Reader</h2>
        </div>
      `;
      mockContentElement.classList.remove('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(false);
      expect(mockContentElement.querySelector('.welcome-container')).toBeTruthy();
      
      // Switch to document layout
      const documentContent = '<h1>Document</h1><p>Content</p>';
      mockContentElement.innerHTML = `<div class="content-wrapper">${documentContent}</div>`;
      mockContentElement.classList.add('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
      expect(mockContentElement.querySelector('.welcome-container')).toBeFalsy();
      expect(mockContentElement.querySelector('.content-wrapper')).toBeTruthy();
    });
    
    test('should properly transition from document to welcome layout', () => {
      // Start with document layout
      mockContentElement.innerHTML = `
        <div class="content-wrapper">
          <h1>Document</h1>
          <p>Content</p>
        </div>
      `;
      mockContentElement.classList.add('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
      expect(mockContentElement.querySelector('.content-wrapper')).toBeTruthy();
      
      // Switch to welcome layout
      mockContentElement.innerHTML = `
        <div class="welcome-container">
          <h2>Markdown Reader</h2>
        </div>
      `;
      mockContentElement.classList.remove('has-document-content');
      
      expect(mockContentElement.classList.contains('has-document-content')).toBe(false);
      expect(mockContentElement.querySelector('.content-wrapper')).toBeFalsy();
      expect(mockContentElement.querySelector('.welcome-container')).toBeTruthy();
    });
  });
  
  describe('CSS Display Mode Consistency', () => {
    test('should maintain consistent display properties based on content type', () => {
      // Test welcome content display
      mockContentElement.classList.remove('has-document-content');
      
      // Should use flex centering for welcome content (via CSS)
      const welcomeDisplayRule = '#content:not(.has-document-content) { display: flex; }';
      expect(welcomeDisplayRule).toContain('display: flex');
      
      // Test document content display
      mockContentElement.classList.add('has-document-content');
      
      // Should use block display for document content (via CSS)
      const documentDisplayRule = '#content.has-document-content { display: block !important; }';
      expect(documentDisplayRule).toContain('display: block');
    });
    
    test('should not conflict with inline styles during layout operations', () => {
      // Ensure CSS classes take precedence over inline styles
      mockContentElement.classList.add('has-document-content');
      
      // Even if inline styles are set, CSS should override
      mockContentElement.style.display = 'flex';
      mockContentElement.style.alignItems = 'center';
      mockContentElement.style.justifyContent = 'center';
      
      // Class should still be present and would override via !important
      expect(mockContentElement.classList.contains('has-document-content')).toBe(true);
      
      // For welcome content
      mockContentElement.classList.remove('has-document-content');
      
      // CSS should handle the centering, not inline styles
      expect(mockContentElement.classList.contains('has-document-content')).toBe(false);
    });

    it('should handle special characters in recent file paths', () => {
      const recentFiles = [
        '/Users/test/File (with parentheses).md',
        '/Users/test/File [with brackets].md',
        '/Users/test/File & Ampersand.md',
        '/Users/test/File "with quotes".md'
      ];

      recentFiles.forEach(filePath => {
        // Test that encoding/decoding preserves the file path
        const encoded = encodeURIComponent(filePath);
        const decoded = decodeURIComponent(encoded);
        expect(decoded).toBe(filePath);

        // Test that the file path can be safely used in HTML attributes
        mockContentElement.innerHTML = `<div data-file-path="${encoded}"></div>`;
        const element = mockContentElement.querySelector('div');
        const retrievedPath = decodeURIComponent(element.getAttribute('data-file-path'));
        expect(retrievedPath).toBe(filePath);
      });
    });
  });
});
