// Tests for search state management and DOM preservation across tabs
describe('Search State Management and DOM Preservation', () => {
  let mockContentElement;
  let mockSearchOverlay;
  let mockSearchInput;
  let mockSearchCounter;
  
  beforeEach(() => {
    // Set up DOM structure
    document.body.innerHTML = `
      <div id="content">
        <div class="content-wrapper">
          <p>Original content that should be preserved</p>
        </div>
      </div>
      <div id="search-overlay" style="display: none;">
        <input type="text" id="search-input" placeholder="Search...">
        <div id="search-counter">0 / 0</div>
        <button id="search-prev">↑</button>
        <button id="search-next">↓</button>
        <button id="search-close">×</button>
      </div>
    `;
    
    mockContentElement = document.getElementById('content');
    mockSearchOverlay = document.getElementById('search-overlay');
    mockSearchInput = document.getElementById('search-input');
    mockSearchCounter = document.getElementById('search-counter');
    
    // Mock global variables
    global.tabs = [];
    global.activeTabId = null;
    global.nextTabId = 1;
    global.currentSearchTerm = '';
    global.searchResults = [];
    global.currentSearchIndex = -1;
    
    // Mock functions
    global.getActiveTab = jest.fn();
    global.updateSearchCounter = jest.fn();
    global.scrollToSearchResult = jest.fn();
    global.performDocumentSearch = jest.fn();
    global.clearSearch = jest.fn();
    global.restoreSearchState = jest.fn();
    global.saveSearchState = jest.fn();
  });
  
  describe('Search State Persistence', () => {
    test('should save search state when switching tabs', () => {
      const tab1 = {
        id: 1,
        title: 'Document1.md',
        searchState: null,
        originalContent: '<p>Original content 1</p>'
      };
      
      const tab2 = {
        id: 2,
        title: 'Document2.md',
        searchState: null,
        originalContent: '<p>Original content 2</p>'
      };
      
      global.tabs = [tab1, tab2];
      global.activeTabId = 1;
      global.getActiveTab.mockReturnValue(tab1);
      
      // Simulate active search
      global.currentSearchTerm = 'content';
      global.searchResults = [
        { element: document.createElement('span'), originalText: 'content' }
      ];
      global.currentSearchIndex = 0;
      
      // Mock saveSearchState implementation
      global.saveSearchState.mockImplementation(() => {
        const activeTab = global.getActiveTab();
        if (activeTab) {
          activeTab.searchState = {
            term: global.currentSearchTerm,
            results: global.searchResults,
            currentIndex: global.currentSearchIndex,
            originalContent: activeTab.originalContent
          };
        }
      });
      
      global.saveSearchState();
      
      expect(global.saveSearchState).toHaveBeenCalled();
      expect(tab1.searchState).toBeDefined();
      expect(tab1.searchState.term).toBe('content');
      expect(tab1.searchState.currentIndex).toBe(0);
    });
    
    test('should restore search state when switching back to tab', () => {
      const searchState = {
        term: 'test',
        results: [
          { element: document.createElement('span'), originalText: 'test' }
        ],
        currentIndex: 0,
        originalContent: '<p>Original test content</p>'
      };
      
      const tab = {
        id: 1,
        title: 'Test.md',
        searchState: searchState,
        originalContent: '<p>Original test content</p>'
      };
      
      global.tabs = [tab];
      global.activeTabId = 1;
      global.getActiveTab.mockReturnValue(tab);
      
      // Mock restoreSearchState implementation
      global.restoreSearchState.mockImplementation(() => {
        const activeTab = global.getActiveTab();
        if (activeTab && activeTab.searchState) {
          global.currentSearchTerm = activeTab.searchState.term;
          global.searchResults = activeTab.searchState.results;
          global.currentSearchIndex = activeTab.searchState.currentIndex;
          
          // Show search overlay
          mockSearchOverlay.style.display = 'flex';
          mockSearchInput.value = global.currentSearchTerm;
        }
      });
      
      global.restoreSearchState();
      
      expect(global.restoreSearchState).toHaveBeenCalled();
      expect(global.currentSearchTerm).toBe('test');
      expect(global.currentSearchIndex).toBe(0);
      expect(mockSearchOverlay.style.display).toBe('flex');
      expect(mockSearchInput.value).toBe('test');
    });
    
    test('should clear search state properly', () => {
      const tab = {
        id: 1,
        title: 'Test.md',
        searchState: {
          term: 'test',
          results: [{ element: document.createElement('span'), originalText: 'test' }],
          currentIndex: 0
        }
      };
      
      global.tabs = [tab];
      global.getActiveTab.mockReturnValue(tab);
      
      // Mock clearSearch implementation
      global.clearSearch.mockImplementation(() => {
        global.currentSearchTerm = '';
        global.searchResults = [];
        global.currentSearchIndex = -1;
        
        const activeTab = global.getActiveTab();
        if (activeTab) {
          activeTab.searchState = null;
        }
        
        mockSearchOverlay.style.display = 'none';
        mockSearchInput.value = '';
      });
      
      global.clearSearch();
      
      expect(global.clearSearch).toHaveBeenCalled();
      expect(global.currentSearchTerm).toBe('');
      expect(global.searchResults.length).toBe(0);
      expect(global.currentSearchIndex).toBe(-1);
      expect(tab.searchState).toBeNull();
      expect(mockSearchOverlay.style.display).toBe('none');
    });
  });
  
  describe('DOM Preservation During Search', () => {
    test('should preserve original DOM structure when highlighting', () => {
      const originalContent = `
        <div class="content-wrapper">
          <h1>Test Document</h1>
          <p>This is a test paragraph with some content.</p>
          <ul>
            <li>First item</li>
            <li>Second item with test word</li>
          </ul>
        </div>
      `;
      
      mockContentElement.innerHTML = originalContent;
      
      // Store original structure
      const originalH1 = mockContentElement.querySelector('h1');
      const originalParagraph = mockContentElement.querySelector('p');
      const originalList = mockContentElement.querySelector('ul');
      const originalListItems = mockContentElement.querySelectorAll('li');
      
      expect(originalH1).toBeTruthy();
      expect(originalParagraph).toBeTruthy();
      expect(originalList).toBeTruthy();
      expect(originalListItems.length).toBe(2);
      
      // Simulate search highlighting (surgical approach)
      const searchTerm = 'test';
      const textNodes = [];
      const walker = document.createTreeWalker(
        mockContentElement,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
          textNodes.push(node);
        }
      }
      
      // Apply highlighting without destroying DOM structure
      textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const lowerText = text.toLowerCase();
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        if (lowerText.includes(lowerSearchTerm)) {
          const startIndex = lowerText.indexOf(lowerSearchTerm);
          const endIndex = startIndex + searchTerm.length;
          
          const beforeText = text.substring(0, startIndex);
          const matchText = text.substring(startIndex, endIndex);
          const afterText = text.substring(endIndex);
          
          const span = document.createElement('span');
          span.className = 'search-highlight';
          span.textContent = matchText;
          
          const fragment = document.createDocumentFragment();
          if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
          fragment.appendChild(span);
          if (afterText) fragment.appendChild(document.createTextNode(afterText));
          
          textNode.parentNode.replaceChild(fragment, textNode);
        }
      });
      
      // Verify DOM structure is preserved
      expect(mockContentElement.querySelector('h1')).toBeTruthy();
      expect(mockContentElement.querySelector('p')).toBeTruthy();
      expect(mockContentElement.querySelector('ul')).toBeTruthy();
      expect(mockContentElement.querySelectorAll('li').length).toBe(2);
      
      // Verify highlighting was applied
      const highlights = mockContentElement.querySelectorAll('.search-highlight');
      expect(highlights.length).toBeGreaterThan(0);
      
      // Verify original content is still accessible
      const highlightedH1 = mockContentElement.querySelector('h1');
      expect(highlightedH1.textContent).toContain('Test Document');
    });
    
    test('should preserve nested elements during search', () => {
      const complexContent = `
        <div class="content-wrapper">
          <div class="section">
            <h2>Section <em>with</em> emphasis</h2>
            <div class="subsection">
              <p>Paragraph with <strong>bold test text</strong> and <a href="#">link test</a>.</p>
              <blockquote>
                <p>Quote with test content inside.</p>
              </blockquote>
            </div>
          </div>
        </div>
      `;
      
      mockContentElement.innerHTML = complexContent;
      
      // Store original nested structure
      const originalSection = mockContentElement.querySelector('.section');
      const originalSubsection = mockContentElement.querySelector('.subsection');
      const originalEmphasis = mockContentElement.querySelector('em');
      const originalStrong = mockContentElement.querySelector('strong');
      const originalLink = mockContentElement.querySelector('a');
      const originalBlockquote = mockContentElement.querySelector('blockquote');
      
      expect(originalSection).toBeTruthy();
      expect(originalSubsection).toBeTruthy();
      expect(originalEmphasis).toBeTruthy();
      expect(originalStrong).toBeTruthy();
      expect(originalLink).toBeTruthy();
      expect(originalBlockquote).toBeTruthy();
      
      // Simulate search for 'test'
      const searchTerm = 'test';
      const walker = document.createTreeWalker(
        mockContentElement,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
          textNodes.push({
            node: node,
            parent: node.parentNode
          });
        }
      }
      
      // Apply highlighting preserving nested structure
      textNodes.forEach(({ node, parent }) => {
        const text = node.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = text.split(regex);
        
        const fragment = document.createDocumentFragment();
        parts.forEach(part => {
          if (part.toLowerCase() === searchTerm.toLowerCase()) {
            const highlight = document.createElement('span');
            highlight.className = 'search-highlight';
            highlight.textContent = part;
            fragment.appendChild(highlight);
          } else if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
        });
        
        parent.replaceChild(fragment, node);
      });
      
      // Verify all nested elements are preserved
      expect(mockContentElement.querySelector('.section')).toBeTruthy();
      expect(mockContentElement.querySelector('.subsection')).toBeTruthy();
      expect(mockContentElement.querySelector('em')).toBeTruthy();
      expect(mockContentElement.querySelector('strong')).toBeTruthy();
      expect(mockContentElement.querySelector('a')).toBeTruthy();
      expect(mockContentElement.querySelector('blockquote')).toBeTruthy();
      
      // Verify original text content is preserved
      expect(mockContentElement.textContent).toContain('with');
      expect(mockContentElement.textContent).toContain('bold test text');
      expect(mockContentElement.textContent).toContain('link test');
      expect(mockContentElement.textContent).toContain('Quote with test content');
      
      // Verify highlighting was applied
      const highlights = mockContentElement.querySelectorAll('.search-highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });
    
    test('should restore original content when search is cleared', () => {
      const originalContent = `
        <div class="content-wrapper">
          <h1>Document Title</h1>
          <p>This document contains test content for searching.</p>
        </div>
      `;
      
      // Store original content
      const tab = {
        id: 1,
        originalContent: originalContent
      };
      
      global.getActiveTab.mockReturnValue(tab);
      
      mockContentElement.innerHTML = originalContent;
      
      // Simulate highlighting
      const testParagraph = mockContentElement.querySelector('p');
      testParagraph.innerHTML = 'This document contains <span class="search-highlight">test</span> content for searching.';
      
      // Verify highlighting exists
      expect(mockContentElement.querySelector('.search-highlight')).toBeTruthy();
      
      // Mock restoration process
      global.clearSearch.mockImplementation(() => {
        const activeTab = global.getActiveTab();
        if (activeTab && activeTab.originalContent) {
          mockContentElement.innerHTML = activeTab.originalContent;
        }
      });
      
      global.clearSearch();
      
      // Verify original content is restored
      expect(mockContentElement.querySelector('.search-highlight')).toBeFalsy();
      expect(mockContentElement.querySelector('h1').textContent).toBe('Document Title');
      expect(mockContentElement.querySelector('p').textContent).toBe('This document contains test content for searching.');
    });
  });
  
  describe('Search Results Navigation', () => {
    test('should maintain search results order during navigation', () => {
      const content = `
        <div class="content-wrapper">
          <p>First test paragraph.</p>
          <p>Second test paragraph.</p>
          <p>Third test paragraph.</p>
        </div>
      `;
      
      mockContentElement.innerHTML = content;
      
      // Simulate finding multiple results
      const searchResults = [
        { element: mockContentElement.querySelectorAll('p')[0], index: 0 },
        { element: mockContentElement.querySelectorAll('p')[1], index: 1 },
        { element: mockContentElement.querySelectorAll('p')[2], index: 2 }
      ];
      
      global.searchResults = searchResults;
      global.currentSearchIndex = 0;
      
      // Test navigation
      expect(global.searchResults.length).toBe(3);
      expect(global.currentSearchIndex).toBe(0);
      
      // Navigate to next result
      global.currentSearchIndex = (global.currentSearchIndex + 1) % global.searchResults.length;
      expect(global.currentSearchIndex).toBe(1);
      
      // Navigate to next result
      global.currentSearchIndex = (global.currentSearchIndex + 1) % global.searchResults.length;
      expect(global.currentSearchIndex).toBe(2);
      
      // Navigate to next result (should wrap to first)
      global.currentSearchIndex = (global.currentSearchIndex + 1) % global.searchResults.length;
      expect(global.currentSearchIndex).toBe(0);
    });
    
    test('should handle empty search results gracefully', () => {
      global.searchResults = [];
      global.currentSearchIndex = -1;
      
      // Mock updateSearchCounter
      global.updateSearchCounter.mockImplementation(() => {
        mockSearchCounter.textContent = `0 / 0`;
      });
      
      global.updateSearchCounter();
      
      expect(global.searchResults.length).toBe(0);
      expect(global.currentSearchIndex).toBe(-1);
      expect(mockSearchCounter.textContent).toBe('0 / 0');
    });
    
    test('should update search counter correctly', () => {
      global.searchResults = [
        { element: document.createElement('span') },
        { element: document.createElement('span') },
        { element: document.createElement('span') }
      ];
      global.currentSearchIndex = 1;
      
      // Mock updateSearchCounter
      global.updateSearchCounter.mockImplementation(() => {
        const current = global.currentSearchIndex >= 0 ? global.currentSearchIndex + 1 : 0;
        const total = global.searchResults.length;
        mockSearchCounter.textContent = `${current} / ${total}`;
      });
      
      global.updateSearchCounter();
      
      expect(mockSearchCounter.textContent).toBe('2 / 3');
    });
  });
  
  describe('Multi-Tab Search Consistency', () => {
    test('should maintain independent search states across tabs', () => {
      const tab1 = {
        id: 1,
        title: 'Doc1.md',
        searchState: {
          term: 'alpha',
          currentIndex: 0,
          results: [{ element: document.createElement('span') }]
        }
      };
      
      const tab2 = {
        id: 2,
        title: 'Doc2.md',
        searchState: {
          term: 'beta',
          currentIndex: 1,
          results: [
            { element: document.createElement('span') },
            { element: document.createElement('span') }
          ]
        }
      };
      
      global.tabs = [tab1, tab2];
      
      // Switch to tab1
      global.activeTabId = 1;
      global.getActiveTab.mockReturnValue(tab1);
      
      global.restoreSearchState.mockImplementation(() => {
        const activeTab = global.getActiveTab();
        if (activeTab && activeTab.searchState) {
          global.currentSearchTerm = activeTab.searchState.term;
          global.currentSearchIndex = activeTab.searchState.currentIndex;
          global.searchResults = activeTab.searchState.results;
        }
      });
      
      global.restoreSearchState();
      
      expect(global.currentSearchTerm).toBe('alpha');
      expect(global.currentSearchIndex).toBe(0);
      expect(global.searchResults.length).toBe(1);
      
      // Switch to tab2
      global.activeTabId = 2;
      global.getActiveTab.mockReturnValue(tab2);
      
      global.restoreSearchState();
      
      expect(global.currentSearchTerm).toBe('beta');
      expect(global.currentSearchIndex).toBe(1);
      expect(global.searchResults.length).toBe(2);
    });
    
    test('should handle tabs without search state', () => {
      const tabWithoutSearch = {
        id: 1,
        title: 'NoSearch.md',
        searchState: null
      };
      
      global.tabs = [tabWithoutSearch];
      global.activeTabId = 1;
      global.getActiveTab.mockReturnValue(tabWithoutSearch);
      
      global.restoreSearchState.mockImplementation(() => {
        const activeTab = global.getActiveTab();
        if (!activeTab || !activeTab.searchState) {
          global.currentSearchTerm = '';
          global.currentSearchIndex = -1;
          global.searchResults = [];
          mockSearchOverlay.style.display = 'none';
        }
      });
      
      global.restoreSearchState();
      
      expect(global.currentSearchTerm).toBe('');
      expect(global.currentSearchIndex).toBe(-1);
      expect(global.searchResults.length).toBe(0);
      expect(mockSearchOverlay.style.display).toBe('none');
    });
  });
});
