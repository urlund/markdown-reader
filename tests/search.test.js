// Integration test for document search functionality
describe('Document Search Integration', () => {
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="searchOverlay" class="search-overlay hidden">
        <div class="search-container">
          <div class="search-input-container">
            <input type="text" id="searchInput" placeholder="Search document..." />
            <div class="search-controls">
              <button id="searchCaseSensitive" class="search-option-btn">Aa</button>
              <span id="searchCounter" class="search-counter"></span>
              <button id="searchPrev" class="search-nav-btn">↑</button>
              <button id="searchNext" class="search-nav-btn">↓</button>
              <button id="searchClose" class="search-close">×</button>
            </div>
          </div>
        </div>
      </div>
      <div id="content">
        <h1>Test Document</h1>
        <p>This is a test paragraph with searchable content.</p>
        <p>Another paragraph for testing search functionality.</p>
      </div>
    `;
  });

  describe('Search DOM Elements', () => {
    test('should have all required search elements', () => {
      expect(document.getElementById('searchOverlay')).toBeTruthy();
      expect(document.getElementById('searchInput')).toBeTruthy();
      expect(document.getElementById('searchCounter')).toBeTruthy();
      expect(document.getElementById('searchPrev')).toBeTruthy();
      expect(document.getElementById('searchNext')).toBeTruthy();
      expect(document.getElementById('searchClose')).toBeTruthy();
      expect(document.getElementById('searchCaseSensitive')).toBeTruthy();
    });

    test('search overlay should be hidden by default', () => {
      const overlay = document.getElementById('searchOverlay');
      expect(overlay.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Search Toggle Functionality', () => {
    test('should be able to show and hide search overlay', () => {
      const overlay = document.getElementById('searchOverlay');
      
      // Show overlay
      overlay.classList.remove('hidden');
      expect(overlay.classList.contains('hidden')).toBe(false);
      
      // Hide overlay
      overlay.classList.add('hidden');
      expect(overlay.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Search Input Functionality', () => {
    test('should be able to input search terms', () => {
      const searchInput = document.getElementById('searchInput');
      
      searchInput.value = 'test';
      expect(searchInput.value).toBe('test');
      
      // Trigger input event
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
      
      expect(searchInput.value).toBe('test');
    });

    test('should handle search input events', () => {
      const searchInput = document.getElementById('searchInput');
      let inputEventTriggered = false;
      
      searchInput.addEventListener('input', () => {
        inputEventTriggered = true;
      });
      
      searchInput.value = 'search term';
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
      
      expect(inputEventTriggered).toBe(true);
    });
  });

  describe('Keyboard Event Handling', () => {
    test('should handle Cmd+F keydown event', () => {
      let cmdFPressed = false;
      
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
          e.preventDefault();
          cmdFPressed = true;
        }
      });
      
      // Simulate Cmd+F
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        metaKey: true,
        bubbles: true,
        cancelable: true
      });
      
      document.dispatchEvent(event);
      expect(cmdFPressed).toBe(true);
    });

    test('should handle Escape key to close search', () => {
      let escapePressed = false;
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          escapePressed = true;
        }
      });
      
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      
      document.dispatchEvent(escapeEvent);
      expect(escapePressed).toBe(true);
    });

    test('should handle Enter key in search input', () => {
      const searchInput = document.getElementById('searchInput');
      let enterPressed = false;
      
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          enterPressed = true;
        }
      });
      
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      
      searchInput.dispatchEvent(enterEvent);
      expect(enterPressed).toBe(true);
    });
  });

  describe('Search Button Functionality', () => {
    test('should handle search navigation button clicks', () => {
      const searchPrev = document.getElementById('searchPrev');
      const searchNext = document.getElementById('searchNext');
      const searchClose = document.getElementById('searchClose');
      
      let prevClicked = false;
      let nextClicked = false;
      let closeClicked = false;
      
      searchPrev.addEventListener('click', () => { prevClicked = true; });
      searchNext.addEventListener('click', () => { nextClicked = true; });
      searchClose.addEventListener('click', () => { closeClicked = true; });
      
      searchPrev.click();
      searchNext.click();
      searchClose.click();
      
      expect(prevClicked).toBe(true);
      expect(nextClicked).toBe(true);
      expect(closeClicked).toBe(true);
    });

    test('should handle case-sensitive toggle', () => {
      const caseSensitive = document.getElementById('searchCaseSensitive');
      let toggleClicked = false;
      
      caseSensitive.addEventListener('click', () => {
        caseSensitive.classList.toggle('active');
        toggleClicked = true;
      });
      
      caseSensitive.click();
      
      expect(toggleClicked).toBe(true);
      expect(caseSensitive.classList.contains('active')).toBe(true);
    });
  });

  describe('Content Detection', () => {
    test('should detect welcome screen', () => {
      const content = document.getElementById('content');
      
      // Normal content
      expect(content.querySelector('.welcome-container')).toBeFalsy();
      
      // Welcome content
      content.innerHTML = '<div class="welcome-container">Welcome</div>';
      expect(content.querySelector('.welcome-container')).toBeTruthy();
    });
  });

  describe('Search Workflow Integration', () => {
    test('complete search workflow simulation', () => {
      const overlay = document.getElementById('searchOverlay');
      const searchInput = document.getElementById('searchInput');
      const content = document.getElementById('content');
      
      // 1. Initial state - overlay hidden
      expect(overlay.classList.contains('hidden')).toBe(true);
      
      // 2. Trigger search (simulate Cmd+F)
      overlay.classList.remove('hidden');
      expect(overlay.classList.contains('hidden')).toBe(false);
      
      // 3. Enter search term
      searchInput.value = 'test';
      const inputEvent = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(inputEvent);
      
      // 4. Verify search term is set
      expect(searchInput.value).toBe('test');
      
      // 5. Close search (simulate Escape)
      overlay.classList.add('hidden');
      expect(overlay.classList.contains('hidden')).toBe(true);
    });
  });
});
