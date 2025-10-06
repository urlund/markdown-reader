// Tab Management System
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// Tab data structure:
// {
//   id: unique identifier,
//   title: display name,
//   filePath: full file path,
//   content: markdown content,
//   htmlContent: rendered HTML,
//   tocData: table of contents,
//   isWelcome: true if welcome tab,
//   searchState: { term: '', results: [], currentIndex: -1, originalContent: '' },
//   tocSearchState: { term: '', caseSensitive: false },
//   scrollPosition: 0
// }

// Recent Files Management using localStorage
const MAX_RECENT_FILES = 10;
const RECENT_FILES_KEY = 'markdown-reader-recent-files';

// Cross-platform filename extraction
function extractFileName(filePath) {
  if (!filePath) return 'Unknown file';
  // Handle both Windows (\\) and Unix/Mac (/) path separators
  const lastBackslash = filePath.lastIndexOf('\\');
  const lastForwardslash = filePath.lastIndexOf('/');
  const lastSeparator = Math.max(lastBackslash, lastForwardslash);
  return lastSeparator >= 0 ? filePath.substring(lastSeparator + 1) : filePath;
}

function getRecentFiles() {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading recent files from localStorage:', error);
    return [];
  }
}

function addRecentFile(filePath) {
  let recentFiles = getRecentFiles();
  
  // Remove if already exists
  recentFiles = recentFiles.filter(file => file !== filePath);
  
  // Add to beginning
  recentFiles.unshift(filePath);
  
  // Limit to MAX_RECENT_FILES
  recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  
  // Save to localStorage
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
    // Update the application menu
    window.api.updateRecentFilesMenu(recentFiles);
  } catch (error) {
    console.error('Error saving recent files to localStorage:', error);
  }
}

function clearRecentFiles() {
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify([]));
    // Update the application menu
    window.api.updateRecentFilesMenu([]);
  } catch (error) {
    console.error('Error clearing recent files from localStorage:', error);
  }
}

async function openRecentFile(filePath) {
  try {
    const result = await window.api.readMarkdownFile(filePath);
    if (result.ok) {
      await displayMarkdownFile(result.content, filePath);
    } else {
      alert(`Error opening file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error opening recent file:', error);
    alert(`Error opening file: ${filePath}`);
  }
}

// Copy functionality
async function handleCopy() {
  try {
    const selection = window.getSelection();
    let textToCopy = '';
    
    if (selection.toString().trim()) {
      // If there's selected text, copy the selection
      textToCopy = selection.toString();
    } else {
      // If no selection, copy the raw markdown content of current tab
      const activeTab = getActiveTab();
      if (activeTab && activeTab.content) {
        textToCopy = activeTab.content;
      }
    }
    
    if (textToCopy) {
      const result = await window.api.copyToClipboard(textToCopy);
      if (result.success) {
        showNotification('Content copied to clipboard', 'success');
      } else {
        showNotification('Failed to copy content', 'error');
      }
    } else {
      showNotification('No content to copy', 'info');
    }
  } catch (error) {
    console.error('Error copying content:', error);
    showNotification('Error copying content', 'error');
  }
}

async function handleCopyAll() {
  try {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.content) {
      const result = await window.api.copyToClipboard(activeTab.content);
      if (result.success) {
        showNotification('All content copied to clipboard', 'success');
      } else {
        showNotification('Failed to copy content', 'error');
      }
    } else {
      showNotification('No content to copy', 'info');
    }
  } catch (error) {
    console.error('Error copying all content:', error);
    showNotification('Error copying content', 'error');
  }
}

function getActiveTab() {
  return tabs.find(tab => tab.id === activeTabId);
}

function updateWindowTitle() {
  const activeTab = getActiveTab();
  if (activeTab && !activeTab.isWelcome && activeTab.filePath) {
    const fileName = extractFileName(activeTab.filePath);
    document.title = `${fileName} - Markdown Reader`;
  } else {
    document.title = 'Markdown Reader';
  }
}

function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('copy-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'copy-notification';
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 40px;
      background: var(--background-color);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 12px 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-size: 14px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      max-width: 300px;
    `;
    document.body.appendChild(notification);
  }
  
  // Set the message and type
  notification.textContent = message;
  notification.className = `notification-${type}`;
  
  // Add type-specific styling
  if (type === 'success') {
    notification.style.borderColor = '#4caf50';
  } else if (type === 'error') {
    notification.style.borderColor = '#f44336';
  } else {
    notification.style.borderColor = 'var(--border-color)';
  }
  
  // Show notification
  notification.style.opacity = '1';
  notification.style.transform = 'translateX(0)';
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
  }, 3000);
}

// Initialize tab system
function initializeTabSystem() {
  // Create welcome tab
  createWelcomeTab();
  
  // Initialize recent files menu with existing files
  const recentFiles = getRecentFiles();
  if (recentFiles.length > 0) {
    window.api.updateRecentFilesMenu(recentFiles);
  }
}

function createWelcomeTab() {
  const welcomeTab = {
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
  
  tabs.push(welcomeTab);
  activeTabId = welcomeTab.id;
  updateTabUI();
  updateContentArea();
  updateWindowTitle();
}

function createNewTab() {
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
  switchToTab(newTab.id);
}

function switchToTab(tabId) {
  // Save current search state and scroll position before switching
  const currentTab = getActiveTab();
  if (currentTab) {
    if (!currentTab.isWelcome) {
      saveCurrentSearchState(currentTab);
    }
    // Save current scroll position
    const contentElement = document.getElementById('content');
    currentTab.scrollPosition = contentElement.scrollTop;
  }
  
  activeTabId = tabId;
  updateTabUI();
  updateContentArea();
  updateWindowTitle();
  
  // Restore search state for new tab
  const newTab = getActiveTab();
  if (newTab && !newTab.isWelcome) {
    restoreSearchState(newTab);
  }
  
  // Restore scroll position for the new tab
  if (newTab) {
    const contentElement = document.getElementById('content');
    setTimeout(() => {
      contentElement.scrollTop = newTab.scrollPosition || 0;
    }, 0);
  }
  
  // If TOC is open, update it for the new tab and apply search
  const tocOverlay = document.getElementById('tocOverlay');
  if (!tocOverlay.classList.contains('hidden')) {
    generateTableOfContents();
    // Apply TOC search after regenerating TOC content
    const tocSearchInput = document.getElementById('tocSearchInput');
    if (tocSearchInput.value.trim()) {
      handleTOCSearch();
    }
  }
}

function updateTabUI() {
  const tabsContainer = document.querySelector('.tabs-container');
  const tabBar = document.getElementById('tabBar');
  
  // Show tab bar if there are tabs
  if (tabs.length > 0) {
    tabBar.classList.remove('hidden');
  } else {
    tabBar.classList.add('hidden');
    // Update Window menu with empty tab list
    if (window.api && window.api.updateTabList) {
      window.api.updateTabList([]);
    }
    return;
  }
  
  // Update Window menu with current tab list
  if (window.api && window.api.updateTabList) {
    const tabListForMenu = tabs.map(tab => ({
      id: tab.id,
      title: tab.title || 'Untitled',
      isActive: tab.id === activeTabId
    }));
    window.api.updateTabList(tabListForMenu);
  }
  
  // Clear existing tabs
  tabsContainer.innerHTML = '';
  
  // Create tab elements
  tabs.forEach((tab, index) => {
    const tabElement = document.createElement('div');
    tabElement.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
    tabElement.onclick = () => switchToTab(tab.id);
    
    // Add middle mouse button click to close tab
    tabElement.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        e.stopPropagation();
        closeTab(tab.id);
      }
    });
    
    // Add drag and drop functionality
    tabElement.draggable = true;
    tabElement.setAttribute('data-tab-id', tab.id);
    tabElement.setAttribute('data-tab-index', index);
    
    // Drag event handlers
    tabElement.addEventListener('dragstart', handleTabDragStart);
    tabElement.addEventListener('dragover', handleTabDragOver);
    tabElement.addEventListener('dragenter', handleTabDragEnter);
    tabElement.addEventListener('dragleave', handleTabDragLeave);
    tabElement.addEventListener('drop', handleTabDrop);
    tabElement.addEventListener('dragend', handleTabDragEnd);
    
    // Create icon element for all tabs
    const iconElement = document.createElement('i');
    iconElement.className = 'tab-icon';
    
    if (tab.isWelcome) {
      // Welcome tab gets a file icon
      iconElement.setAttribute('data-lucide', 'file');
    } else if (tab.filePath) {
      // Document tabs get file-text icon
      iconElement.setAttribute('data-lucide', 'file-text');
      iconElement.setAttribute('data-file-path', tab.filePath); // Store file path for tooltip
    }
    
    tabElement.appendChild(iconElement);
    
    const titleElement = document.createElement('span');
    titleElement.className = 'tab-title';
    titleElement.textContent = tab.title;
    
    tabElement.appendChild(titleElement);

    // Show close button for all tabs
    const closeButton = document.createElement('button');
    closeButton.className = 'tab-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    };
    
    tabElement.appendChild(closeButton);    tabsContainer.appendChild(tabElement);
  });
  
  // Add the new tab button after all tabs
  const newTabBtn = document.createElement('button');
  newTabBtn.id = 'newTabBtn';
  newTabBtn.className = 'new-tab-btn';
  newTabBtn.title = 'New Tab';
  newTabBtn.textContent = '+';
  newTabBtn.addEventListener('click', createNewTab);
  tabsContainer.appendChild(newTabBtn);
  
  // Initialize Lucide icons for the newly created tabs
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    
    // Add tooltips to the newly created SVG icons for document tabs (Lucide replaces <i> with <svg>)
    const svgIcons = tabsContainer.querySelectorAll('svg[data-lucide="file-text"]');
    svgIcons.forEach(svgElement => {
      // Find the parent tab element to get the file path
      const tabElement = svgElement.closest('.tab');
      const iconElement = tabElement.querySelector('.tab-icon');
      const filePath = iconElement?.getAttribute('data-file-path');
      
      if (filePath) {
        addCustomTooltip(svgElement, filePath);
        
        // Add click handler to copy file path
        svgElement.style.cursor = 'pointer';
        svgElement.onclick = async (e) => {
          e.stopPropagation(); // Prevent tab switching
          try {
            await window.api.copyToClipboard(filePath);
            showNotification('Copied file path', 'success');
          } catch (error) {
            console.error('Failed to copy file path:', error);
            showNotification('Failed to copy file path', 'error');
          }
        };
      }
    });
  }
}

// Drag and drop functionality for tab reordering
let draggedTabIndex = null;
let draggedTabId = null;

function handleTabDragStart(e) {
  draggedTabIndex = parseInt(e.target.getAttribute('data-tab-index'));
  draggedTabId = parseInt(e.target.getAttribute('data-tab-id'));
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleTabDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleTabDragEnter(e) {
  e.preventDefault();
  if (e.target.classList.contains('tab')) {
    e.target.classList.add('drag-over');
  }
}

function handleTabDragLeave(e) {
  if (e.target.classList.contains('tab')) {
    e.target.classList.remove('drag-over');
  }
}

function handleTabDrop(e) {
  e.preventDefault();
  e.target.classList.remove('drag-over');
  
  const targetTabIndex = parseInt(e.target.getAttribute('data-tab-index'));
  const targetTabId = parseInt(e.target.getAttribute('data-tab-id'));
  
  if (draggedTabIndex !== null && targetTabIndex !== null && draggedTabIndex !== targetTabIndex) {
    // Reorder tabs array
    const draggedTab = tabs[draggedTabIndex];
    tabs.splice(draggedTabIndex, 1);
    tabs.splice(targetTabIndex, 0, draggedTab);
    
    // Update UI
    updateTabUI();
    updateContentArea();
    updateWindowTitle();
  }
}

function handleTabDragEnd(e) {
  e.target.style.opacity = '';
  draggedTabIndex = null;
  draggedTabId = null;
  
  // Remove drag-over class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('drag-over');
  });
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(tab => tab.id === tabId);
  if (tabIndex === -1) return;
  
  const tab = tabs[tabIndex];
  
  // Stop watching file if it was being watched
  if (tab.filePath && !tab.isWelcome) {
    try {
      window.api.stopWatchingFile(tab.filePath);
      console.log(`Stopped watching file: ${tab.filePath}`);
    } catch (error) {
      console.warn(`Could not stop watching file: ${error.message}`);
    }
  }
  
  // If closing the active tab, close any open overlays
  if (activeTabId === tabId) {
    hideTableOfContents();
    hideDocumentSearch();
  }
  
  // Hide any active tooltip and clear timeouts
  hideCustomTooltip();
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  
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
  
  updateTabUI();
  updateContentArea();
  updateWindowTitle();
}

// Function to close all tabs and create a new welcome tab
function closeAllTabs() {
  try {
    // Stop watching all files that are currently being watched
    tabs.forEach(tab => {
      if (tab.filePath && !tab.isWelcome) {
        try {
          window.api.stopWatchingFile(tab.filePath);
          console.log(`Stopped watching file: ${tab.filePath}`);
        } catch (error) {
          console.warn(`Could not stop watching file: ${error.message}`);
        }
      }
    });
    
    // Close any open overlays
    hideTableOfContents();
    hideDocumentSearch();
    
    // Hide any active tooltip and clear timeouts
    hideCustomTooltip();
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }
    
    // Clear all tabs
    tabs = [];
    activeTabId = null;
    
    // Create a new welcome tab
    createNewTab();
    
    console.log('All tabs closed and new welcome tab created');
  } catch (error) {
    console.error('Error during close all tabs:', error);
    // Fallback: ensure we have at least one tab
    if (tabs.length === 0) {
      createNewTab();
    }
  }
}

function updateContentArea() {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab) return;
  
  const content = document.getElementById('content');
  
  if (activeTab.isWelcome) {
    const recentFiles = getRecentFiles();
    const recentFilesHtml = recentFiles.length > 0 
      ? `<div class="recent-files">
          <h3>Recent Files</h3>
          <ul class="recent-files-list">
            ${recentFiles.map(filePath => {
              const fileName = extractFileName(filePath);
              const encodedFilePath = encodeURIComponent(filePath);
              return `<li class="recent-file-item" data-file-path="${encodedFilePath}">
                <i data-lucide="file-text" class="recent-file-icon"></i>
                <span class="recent-file-name">${fileName}</span>
                <span class="recent-file-path">${filePath}</span>
              </li>`;
            }).join('')}
          </ul>
        </div>`
      : '<div class="no-recent-files"><p>No recent files</p></div>';

    content.innerHTML = `
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
        ${recentFilesHtml}
      </div>
    `;
    
    // Initialize Lucide icons for the welcome content
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Reset content styling for welcome - let CSS handle the display mode
    content.classList.remove('has-document-content');
  } else {
    // Wrap content in content-wrapper for proper centering
    content.innerHTML = `<div class="content-wrapper">${activeTab.htmlContent || ''}</div>`;
    
    // Add class to ensure stable layout during search operations - let CSS handle display mode
    content.classList.add('has-document-content');
    
    // Set original content for search (will be restored in restoreSearchState if needed)
    if (!activeTab.searchState.originalContent) {
      activeTab.searchState.originalContent = activeTab.htmlContent;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeTabSystem();
  initializeSettings();
  initializeSearch();
});

// Menu event listeners (now using welcome message as file opener)
window.api.onMenuOpenFile(() => openFile());
window.api.onMenuNewTab(() => createNewTab());
window.api.onMenuToggleTheme(() => {
  // Toggle between light and dark, but don't change the saved preference
  document.body.classList.toggle('dark-theme');
  // Toggle Prism.js theme as well
  const prismTheme = document.getElementById('prism-theme');
  const isDark = document.body.classList.contains('dark-theme');
  prismTheme.href = isDark 
    ? '../node_modules/prismjs/themes/prism-dark.css'
    : '../node_modules/prismjs/themes/prism.css';
});
window.api.onMenuToggleTOC(() => toggleTableOfContents());
window.api.onMenuOpenSettings(() => openSettings());
window.api.onMenuSwitchToTab((event, tabIndex) => {
  if (tabIndex >= 0 && tabIndex < tabs.length) {
    switchToTab(tabs[tabIndex].id);
  }
});
window.api.onMenuCloseAllTabs(() => {
  closeAllTabs();
});
window.api.onMenuCopy(() => handleCopy());
window.api.onMenuCopyAll(() => handleCopyAll());
window.api.onClearRecentFiles(() => {
  clearRecentFiles();
});

// Handle files opened from system (Open with, double-click, etc.)
window.api.onOpenFileFromSystem((event, data) => {
  displayMarkdownFile(data.content, data.filePath);
});

// Removed auto-open file dialog feature

// Handle file changes from external editors
window.api.onFileChanged(async (event, changedFilePath) => {
  console.log(`File changed externally: ${changedFilePath}`);
  
  // Find the tab with this file path
  const tab = tabs.find(t => t.filePath === changedFilePath);
  if (!tab) {
    return; // File not open in any tab
  }
  
  try {
    // Re-read the file content
    const result = await window.api.readMarkdownFile(changedFilePath);
    if (result.ok) {
      // Parse the new content
      const newHtml = await window.api.parseMarkdown(result.content);
      
      // Update tab data
      tab.content = result.content;
      tab.htmlContent = newHtml;
      
      // Regenerate TOC
      const tocResult = generateTableOfContentsForTab(newHtml);
      tab.tocData = tocResult;
      tab.htmlContent = tocResult.updatedHtml;
      
      // Clear any search state since content changed
      tab.searchState = { term: '', results: [], currentIndex: -1, originalContent: '' };
      
      // If this is the active tab, update the display
      if (tab.id === activeTabId) {
        updateContentArea();
        
        // Show a brief notification
        showFileReloadNotification(tab.title);
      }
      
      console.log(`Successfully reloaded content for: ${tab.title}`);
    }
  } catch (error) {
    console.error(`Error reloading file ${changedFilePath}:`, error);
    // Could show an error notification here if desired
  }
});

// File reload notification
function showFileReloadNotification(fileName) {
  // Remove any existing notification
  const existingNotification = document.querySelector('.file-reload-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'file-reload-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">🔄</span>
      <span class="notification-text">File reloaded: ${fileName}</span>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 3000);
}

// Settings functionality
async function openSettings() {
  const settingsOverlay = document.getElementById('settingsOverlay');
  loadSettingsValues();
  await loadAppVersion();
  settingsOverlay.classList.remove('hidden');
}

function closeSettings() {
  const settingsOverlay = document.getElementById('settingsOverlay');
  settingsOverlay.classList.add('hidden');
}

function loadSettingsValues() {
  const savedTheme = localStorage.getItem('defaultTheme') || 'system';
  // Clear all radio buttons first
  document.querySelectorAll('input[name="defaultTheme"]').forEach(radio => {
    radio.checked = false;
  });
  // Set the saved theme or default to system
  const themeRadio = document.querySelector(`input[name="defaultTheme"][value="${savedTheme}"]`);
  if (themeRadio) {
    themeRadio.checked = true;
  }
}

async function loadAppVersion() {
  try {
    const version = await window.api.getAppVersion();
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
      versionElement.textContent = `v${version}`;
    }
  } catch (error) {
    console.error('Error loading app version:', error);
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
      versionElement.textContent = 'Version unavailable';
    }
  }
}

function saveSettings() {
  const selectedTheme = document.querySelector('input[name="defaultTheme"]:checked')?.value || 'system';
  localStorage.setItem('defaultTheme', selectedTheme);
  applyThemeFromSettings();
  closeSettings();
}

function applyThemeFromSettings() {
  const savedTheme = localStorage.getItem('defaultTheme') || 'system';
  const prismTheme = document.getElementById('prism-theme');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    prismTheme.href = '../node_modules/prismjs/themes/prism-dark.css';
  } else if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    prismTheme.href = '../node_modules/prismjs/themes/prism.css';
  } else { // Default to 'system' for any other value or when not set
    // Follow system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.body.classList.add('dark-theme');
      prismTheme.href = '../node_modules/prismjs/themes/prism-dark.css';
    } else {
      document.body.classList.remove('dark-theme');
      prismTheme.href = '../node_modules/prismjs/themes/prism.css';
    }
  }
}

// Initialize settings when DOM is loaded
function initializeSettings() {
  // Apply saved theme on startup
  applyThemeFromSettings();
  
  // Settings overlay event listeners
  document.getElementById('settingsClose').addEventListener('click', closeSettings);
  document.getElementById('settingsSave').addEventListener('click', saveSettings);
  
  // Close settings when clicking outside
  document.getElementById('settingsOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'settingsOverlay') {
      closeSettings();
    }
  });
  
  // Listen for system theme changes when using system preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const savedTheme = localStorage.getItem('defaultTheme') || 'system';
    if (savedTheme === 'system') {
      applyThemeFromSettings();
    }
  });
  
  // ESC key to close settings
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const settingsOverlay = document.getElementById('settingsOverlay');
      if (!settingsOverlay.classList.contains('hidden')) {
        closeSettings();
      }
    }
  });
}

// File opening function
async function openFile() {
  try {
    const result = await window.api.openMarkdownFile();
    if (!result.canceled && result.files && result.files.length > 0) {
      // Process all selected files
      for (const file of result.files) {
        await displayMarkdownFile(file.content, file.filePath);
      }
      
      if (result.files.length > 1) {
        showNotification(`Opened ${result.files.length} files`, 'success');
      }
    }
  } catch (error) {
    console.error('Error opening file:', error);
    showNotification('Error opening files', 'error');
  }
}

// Welcome interface click handlers
document.addEventListener('click', (e) => {
  // Open File button handler
  if (e.target.closest('#openFileBtn')) {
    openFile();
    return;
  }
  
  // Recent file item handler
  const recentFileItem = e.target.closest('.recent-file-item');
  if (recentFileItem) {
    const encodedFilePath = recentFileItem.getAttribute('data-file-path');
    if (encodedFilePath) {
      const filePath = decodeURIComponent(encodedFilePath);
      openRecentFile(filePath);
    }
    return;
  }
});

// Function to display markdown content
async function displayMarkdownFile(content, filePath) {
  try {
    const html = await window.api.parseMarkdown(content);
    const fileName = extractFileName(filePath);
    
    // Check if this file is already open in a tab
    const existingTab = tabs.find(tab => tab.filePath === filePath);
    if (existingTab) {
      // Switch to existing tab instead of creating a new one
      switchToTab(existingTab.id);
      return;
    }
    
    // Get or create tab for this file
    let tab = getActiveTab();
    if (!tab || !tab.isWelcome) {
      // Create new tab for this file if current tab is not a welcome tab
      tab = {
        id: nextTabId++,
        title: fileName,
        filePath: filePath,
        content: content,
        htmlContent: html,
        tocData: null,
        isWelcome: false,
        searchState: { term: '', results: [], currentIndex: -1, originalContent: '' },
        tocSearchState: { term: '', caseSensitive: false },
        scrollPosition: 0
      };
      tabs.push(tab);
      activeTabId = tab.id;
    } else {
      // Update existing welcome tab
      tab.title = fileName;
      tab.filePath = filePath;
      tab.content = content;
      tab.htmlContent = html;
      tab.isWelcome = false;
      tab.searchState = { term: '', results: [], currentIndex: -1, originalContent: '' };
      tab.tocSearchState = { term: '', caseSensitive: false };
      tab.scrollPosition = 0;
    }
    
    // Generate TOC for this tab and update HTML with IDs
    const tocResult = generateTableOfContentsForTab(html);
    tab.tocData = tocResult;
    tab.htmlContent = tocResult.updatedHtml;
    
    // Add to recent files
    addRecentFile(filePath);
    
    // Start watching this file for changes
    try {
      await window.api.startWatchingFile(filePath);
      console.log(`Started watching file for changes: ${filePath}`);
    } catch (error) {
      console.warn(`Could not start watching file: ${error.message}`);
    }
    
    // Update UI
    updateTabUI();
    updateContentArea();
    updateWindowTitle();
  } catch (error) {
    console.error('Error parsing markdown:', error);
    const activeTab = getActiveTab();
    if (activeTab) {
      activeTab.htmlContent = 'Error loading file: ' + error.message;
      updateContentArea();
    }
  }
}

// Table of Contents functionality
function generateTableOfContentsForTab(htmlContent) {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  const tocData = [];
  headings.forEach((heading, index) => {
    // Add an ID to the heading for navigation
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
    
    tocData.push({
      id: heading.id,
      text: heading.textContent,
      level: parseInt(heading.tagName.substring(1))
    });
  });
  
  // Update the original HTML with IDs
  return {
    items: tocData,
    updatedHtml: tempDiv.innerHTML
  };
}

function generateTableOfContents() {
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.isWelcome || !activeTab.tocData || !activeTab.tocData.items) {
    const tocContent = document.getElementById('tocContent');
    tocContent.innerHTML = '<p class="no-headings">No headings found in this document.</p>';
    return;
  }
  
  const tocContent = document.getElementById('tocContent');
  const tocItems = activeTab.tocData.items;
  
  if (tocItems.length === 0) {
    tocContent.innerHTML = '<p class="no-headings">No headings found in this document.</p>';
    return;
  }
  
  tocContent.innerHTML = '';
  
  tocItems.forEach((item) => {
    // Create TOC item
    const tocItem = document.createElement('a');
    tocItem.className = `toc-item level-${item.level}`;
    tocItem.textContent = item.text;
    tocItem.href = `#${item.id}`;
    
    // Add click handler for smooth scrolling
    tocItem.addEventListener('click', (e) => {
      e.preventDefault();
      const heading = document.getElementById(item.id);
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      hideTableOfContents();
    });
    
    tocContent.appendChild(tocItem);
  });
}

function toggleTableOfContents() {
  // Only allow TOC if a file is loaded
  if (!document.getElementById('content').innerHTML.trim() || 
      document.querySelector('.welcome-container')) {
    return;
  }
  
  const tocOverlay = document.getElementById('tocOverlay');
  if (tocOverlay.style.display === 'flex') {
    hideTableOfContents();
  } else {
    showTableOfContents();
  }
}

function showTableOfContents() {
  // First generate/refresh the TOC for the current tab
  generateTableOfContents();
  
  const overlay = document.getElementById('tocOverlay');
  overlay.classList.remove('hidden');
  
  // Restore TOC search state for current tab instead of clearing
  const activeTab = getActiveTab();
  
  if (activeTab && activeTab.tocSearchState) {
    // Restore case-sensitive button state
    tocSearchCaseSensitive.classList.toggle('active', activeTab.tocSearchState.caseSensitive);
    
    if (activeTab.tocSearchState.term) {
      // Restore previous search term and apply filtering
      tocSearchInput.value = activeTab.tocSearchState.term;
      handleTOCSearch();
      // Focus at end of input
      setTimeout(() => {
        tocSearchInput.focus();
        tocSearchInput.setSelectionRange(tocSearchInput.value.length, tocSearchInput.value.length);
      }, 100);
    } else {
      // No previous search, clear and focus
      clearTOCSearch();
      setTimeout(() => {
        tocSearchInput.focus();
      }, 100);
    }
  } else {
    // No active tab, just clear and focus
    clearTOCSearch();
    setTimeout(() => {
      tocSearchInput.focus();
    }, 100);
  }
}

function hideTableOfContents() {
  // Save TOC search state before hiding
  const activeTab = getActiveTab();
  if (activeTab && !activeTab.isWelcome) {
    const tocSearchInput = document.getElementById('tocSearchInput');
    activeTab.tocSearchState = {
      term: tocSearchInput.value,
      caseSensitive: activeTab.tocSearchState.caseSensitive || false
    };
  }
  
  const overlay = document.getElementById('tocOverlay');
  overlay.classList.add('hidden');
}

// TOC overlay event listeners
document.getElementById('tocClose').addEventListener('click', hideTableOfContents);
document.getElementById('tocOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    hideTableOfContents();
  }
});

// TOC search functionality
const tocSearchInput = document.getElementById('tocSearchInput');
const tocSearchClear = document.getElementById('tocSearchClear');
const tocSearchCaseSensitive = document.getElementById('tocSearchCaseSensitive');

tocSearchInput.addEventListener('input', handleTOCSearch);
tocSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearTOCSearch();
    hideTableOfContents();
  }
});

tocSearchClear.addEventListener('click', clearTOCSearch);

// TOC case-sensitive toggle
tocSearchCaseSensitive.addEventListener('click', () => {
  const tab = getActiveTab();
  if (tab) {
    tab.tocSearchState.caseSensitive = !tab.tocSearchState.caseSensitive;
    tocSearchCaseSensitive.classList.toggle('active', tab.tocSearchState.caseSensitive);
    handleTOCSearch(); // Re-run search with new case setting
  }
});

function handleTOCSearch() {
  const tab = getActiveTab();
  if (!tab) return;
  
  const searchTerm = tocSearchInput.value.trim();
  const caseSensitive = tab.tocSearchState.caseSensitive;
  const processedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  const tocItems = document.querySelectorAll('.toc-item');
  const tocContent = document.getElementById('tocContent');
  let visibleCount = 0;
  
  // Update tab search state
  tab.tocSearchState.term = searchTerm;
  
  // Show/hide clear button
  if (searchTerm) {
    tocSearchClear.classList.remove('hidden');
  } else {
    tocSearchClear.classList.add('hidden');
  }
  
  // Remove existing no results message
  const existingNoResults = document.querySelector('.toc-no-results');
  if (existingNoResults) {
    existingNoResults.remove();
  }
  
  tocItems.forEach(item => {
    const text = caseSensitive ? item.textContent : item.textContent.toLowerCase();
    const isVisible = !searchTerm || text.includes(processedSearchTerm);
    
    if (isVisible) {
      item.classList.remove('hidden');
      visibleCount++;
      
      // Highlight search term
      if (searchTerm) {
        const originalText = item.getAttribute('data-original-text') || item.textContent;
        if (!item.getAttribute('data-original-text')) {
          item.setAttribute('data-original-text', originalText);
        }
        
        const highlightedText = highlightTOCSearchTerm(originalText, searchTerm, caseSensitive);
        item.innerHTML = highlightedText;
      } else {
        // Restore original text
        const originalText = item.getAttribute('data-original-text');
        if (originalText) {
          item.textContent = originalText;
        }
      }
    } else {
      item.classList.add('hidden');
    }
  });
  
  // Show no results message if needed
  if (searchTerm && visibleCount === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'toc-no-results';
    noResults.textContent = `No headings found for "${searchTerm}"`;
    tocContent.appendChild(noResults);
  }
}

function highlightTOCSearchTerm(text, searchTerm, caseSensitive) {
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, flags);
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearTOCSearch() {
  tocSearchInput.value = '';
  tocSearchClear.classList.add('hidden');
  
  // Reset case-sensitive state for current tab
  const activeTab = getActiveTab();
  if (activeTab) {
    activeTab.tocSearchState.term = '';
    activeTab.tocSearchState.caseSensitive = false;
    tocSearchCaseSensitive.classList.remove('active');
  }
  
  // Remove no results message
  const noResults = document.querySelector('.toc-no-results');
  if (noResults) {
    noResults.remove();
  }
  
  // Show all items and restore original text
  const tocItems = document.querySelectorAll('.toc-item');
  tocItems.forEach(item => {
    item.classList.remove('hidden');
    const originalText = item.getAttribute('data-original-text');
    if (originalText) {
      item.textContent = originalText;
    }
  });
  
  tocSearchInput.focus();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Don't intercept keystrokes when typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
  
  if (cmdOrCtrl && e.key === 'n' && !e.shiftKey) { // Cmd+N / Ctrl+N
    e.preventDefault();
    createNewTab();
  }
  if (cmdOrCtrl && e.key === 'n' && e.shiftKey) { // Cmd+Shift+N / Ctrl+Shift+N
    e.preventDefault();
    // Request new window from main process
    window.api.createNewWindow();
  }
  if (cmdOrCtrl && e.key === 't') { // Cmd+T / Ctrl+T
    e.preventDefault();
    // Only allow TOC if a file is loaded
    if (!document.getElementById('content').innerHTML.trim() || 
        document.querySelector('.welcome-container')) {
      return;
    }
    toggleTableOfContents();
  }
  if (cmdOrCtrl && e.key === 'f') { // Cmd+F / Ctrl+F
    e.preventDefault();
    toggleDocumentSearch();
  }
  if (cmdOrCtrl && e.key === 'c' && !e.shiftKey) { // Cmd+C / Ctrl+C
    e.preventDefault();
    handleCopy();
  }
  if (cmdOrCtrl && e.key === 'c' && e.shiftKey) { // Cmd+Shift+C / Ctrl+Shift+C
    e.preventDefault();
    handleCopyAll();
  }
  if (cmdOrCtrl && e.key === 'w') { // Cmd+W / Ctrl+W
    e.preventDefault();
    if (activeTabId) {
      closeTab(activeTabId);
    }
  }
  
  if (cmdOrCtrl && e.shiftKey && e.key === 'w') { // Cmd+Shift+W / Ctrl+Shift+W
    e.preventDefault();
    closeAllTabs();
  }
  
  // Tab switching with Cmd+1, Cmd+2, etc.
  if (e.metaKey && /^[1-9]$/.test(e.key)) { // Cmd+1 through Cmd+9
    e.preventDefault();
    const tabIndex = parseInt(e.key) - 1; // Convert to 0-based index
    if (tabIndex < tabs.length) {
      switchToTab(tabs[tabIndex].id);
    }
  }
  
  // Tab navigation with arrow keys
  if (e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    if (currentIndex !== -1) {
      let newIndex;
      if (e.key === 'ArrowLeft') {
        // Go to previous tab, wrap around to last tab if at first
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else {
        // Go to next tab, wrap around to first tab if at last
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }
      switchToTab(tabs[newIndex].id);
    }
  }
  
  // Document scrolling with arrow keys (when no overlays are open)
  if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    // Only scroll if no overlays are open and not in input fields
    const tocOverlay = document.getElementById('tocOverlay');
    const searchOverlay = document.getElementById('searchOverlay');
    const activeElement = document.activeElement;
    
    // Don't scroll if TOC/search is open or if focus is in an input
    if (!tocOverlay.classList.contains('hidden') || 
        searchOverlay.style.display === 'flex' ||
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA') {
      return;
    }
    
    e.preventDefault();
    const contentElement = document.getElementById('content');
    
    if (cmdOrCtrl) {
      // Cmd+Arrow: Jump to top/bottom
      if (e.key === 'ArrowUp') {
        contentElement.scrollTo(0, 0); // Jump to top
      } else {
        contentElement.scrollTo(0, contentElement.scrollHeight); // Jump to bottom
      }
    } else {
      // Plain Arrow: Smooth scroll
      const scrollAmount = 50; // Reduced from 100 for smoother scrolling
      
      if (e.key === 'ArrowUp') {
        contentElement.scrollBy(0, -scrollAmount);
      } else {
        contentElement.scrollBy(0, scrollAmount);
      }
    }
  }
  
  if (e.key === 'Escape') {
    hideTableOfContents();
    hideDocumentSearch();
  }
});

// Tab Search State Management
function saveCurrentSearchState(tab) {
  const searchInput = document.getElementById('searchInput');
  tab.searchState = {
    term: searchInput.value,
    results: [...searchResults],
    currentIndex: currentSearchIndex,
    originalContent: originalContent
  };
  
  // Always save TOC search state (whether TOC is open or closed)
  const tocSearchInput = document.getElementById('tocSearchInput');
  tab.tocSearchState = {
    term: tocSearchInput.value
  };
}

function restoreSearchState(tab) {
  const searchInput = document.getElementById('searchInput');
  const searchCounter = document.getElementById('searchCounter');
  const searchOverlay = document.getElementById('searchOverlay');
  
  if (tab.searchState.term) {
    searchInput.value = tab.searchState.term;
    searchResults = [...tab.searchState.results];
    currentSearchIndex = tab.searchState.currentIndex;
    originalContent = tab.searchState.originalContent;
    
    // Update search counter and navigation
    updateSearchCounter();
    updateNavigationButtons();
    
    // Re-apply search highlighting
    if (searchResults.length > 0) {
      performDocumentSearch(tab.searchState.term);
      if (currentSearchIndex >= 0 && currentSearchIndex < searchResults.length) {
        highlightCurrentResult();
      }
    }
    
    // Show search overlay if there was a search
    searchOverlay.classList.remove('hidden');
  } else {
    searchInput.value = '';
    searchResults = [];
    currentSearchIndex = -1;
    originalContent = tab.htmlContent || '';
    
    // Hide search overlay
    searchOverlay.classList.add('hidden');
  }
  
  // Restore TOC search state
  const tocSearchInput = document.getElementById('tocSearchInput');
  if (tab.tocSearchState && tab.tocSearchState.term) {
    tocSearchInput.value = tab.tocSearchState.term;
    // Don't trigger TOC search here - it will be applied after TOC regeneration
  } else {
    tocSearchInput.value = '';
  }
}

// Document Search Functionality
let searchResults = [];
let currentSearchIndex = -1;
let originalContent = '';

// Search elements will be initialized after DOM loads
let searchInput, searchCounter, searchPrev, searchNext, searchClose, searchCaseSensitive;

function initializeSearch() {
  searchInput = document.getElementById('searchInput');
  searchCounter = document.getElementById('searchCounter');
  searchPrev = document.getElementById('searchPrev');
  searchNext = document.getElementById('searchNext');
  searchClose = document.getElementById('searchClose');
  searchCaseSensitive = document.getElementById('searchCaseSensitive');

  if (!searchInput) {
    console.error('Could not find searchInput element');
    return;
  }

  // Search event listeners
  searchInput.addEventListener('input', handleDocumentSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateSearchResults('prev');
      } else {
        navigateSearchResults('next');
      }
    }
    if (e.key === 'Escape') {
      hideDocumentSearch();
    }
  });

  searchPrev.addEventListener('click', () => navigateSearchResults('prev'));
  searchNext.addEventListener('click', () => navigateSearchResults('next'));
  searchClose.addEventListener('click', hideDocumentSearch);
  
  // Case-sensitive toggle
  searchCaseSensitive.addEventListener('click', () => {
    searchCaseSensitive.classList.toggle('active');
    // Re-run search if there's a search term
    if (searchInput.value.trim()) {
      handleDocumentSearch();
    }
  });
}

function toggleDocumentSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (overlay.classList.contains('hidden')) {
    showDocumentSearch();
  } else {
    hideDocumentSearch();
  }
}

function showDocumentSearch() {
  const overlay = document.getElementById('searchOverlay');
  const content = document.getElementById('content');
  
  // Don't show search if we're on the welcome screen
  if (content.querySelector('.welcome-container')) {
    return;
  }
  
  overlay.classList.remove('hidden');
  
  // Store original content for the current tab
  const activeTab = getActiveTab();
  if (activeTab && !activeTab.searchState.originalContent) {
    activeTab.searchState.originalContent = content.innerHTML;
    originalContent = content.innerHTML; // Also set global for current use
  } else if (activeTab) {
    originalContent = activeTab.searchState.originalContent; // Use stored content
  }
  
  setTimeout(() => {
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, 100);
}

function hideDocumentSearch() {
  const overlay = document.getElementById('searchOverlay');
  overlay.classList.add('hidden');
  
  // Clear search and restore original content
  clearDocumentSearch();
}

function handleDocumentSearch() {
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    clearDocumentSearch();
    return;
  }
  
  performDocumentSearch(searchTerm);
  updateSearchCounter();
  updateNavigationButtons();
}

function performDocumentSearch(searchTerm) {
  const content = document.getElementById('content');
  
  // Preserve scroll position and layout state
  const scrollTop = content.scrollTop;
  const contentRect = content.getBoundingClientRect();
  
  // Clear previous search results but preserve DOM structure as much as possible
  const existingHighlights = content.querySelectorAll('.search-highlight');
  existingHighlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize(); // Merge adjacent text nodes
  });
  
  searchResults = [];
  currentSearchIndex = -1;
  
  if (!searchTerm) return;
  
  // Find and highlight all occurrences in text nodes only
  let resultIndex = 0;
  
  function highlightTextNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const isCaseSensitive = searchCaseSensitive.classList.contains('active');
      const flags = isCaseSensitive ? 'g' : 'gi';
      const regex = new RegExp(`(${escapeRegex(searchTerm)})`, flags);
      
      if (regex.test(text)) {
        const parent = node.parentNode;
        const wrapper = document.createElement('span');
        
        // Split text and create highlighted spans
        // Need to reset regex for split since test() moved the lastIndex
        const splitRegex = new RegExp(`(${escapeRegex(searchTerm)})`, flags);
        const parts = text.split(splitRegex);
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            // Regular text
            if (parts[i]) {
              fragment.appendChild(document.createTextNode(parts[i]));
            }
          } else {
            // Highlighted text
            const highlight = document.createElement('span');
            highlight.className = 'search-highlight';
            highlight.id = `search-result-${resultIndex}`;
            highlight.textContent = parts[i];
            searchResults.push({ id: highlight.id, element: highlight });
            resultIndex++;
            fragment.appendChild(highlight);
          }
        }
        
        parent.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip script and style elements
      if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
        // Process child nodes (use slice to avoid live NodeList issues)
        const children = Array.from(node.childNodes);
        children.forEach(child => highlightTextNode(child));
      }
    }
  }
  
  highlightTextNode(content);
  
  // Restore scroll position to prevent layout shift
  content.scrollTop = scrollTop;
  
  // Highlight first result (but don't scroll to it immediately to avoid shift)
  if (searchResults.length > 0) {
    currentSearchIndex = 0;
    // Don't call highlightCurrentResult() here to avoid immediate scrollIntoView
    // Just add the 'current' class
    if (searchResults[0] && searchResults[0].element) {
      searchResults[0].element.classList.add('current');
    }
  }
}

function navigateSearchResults(direction) {
  if (searchResults.length === 0) return;
  
  // Remove current highlight
  if (currentSearchIndex >= 0 && searchResults[currentSearchIndex]) {
    searchResults[currentSearchIndex].element.classList.remove('current');
  }
  
  // Update index
  if (direction === 'next') {
    currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
  } else {
    currentSearchIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1;
  }
  
  highlightCurrentResult();
  updateSearchCounter();
}

function highlightCurrentResult() {
  // Remove previous current highlights
  document.querySelectorAll('.search-highlight.current').forEach(el => {
    el.classList.remove('current');
  });
  
  if (currentSearchIndex >= 0 && searchResults[currentSearchIndex]) {
    // Refresh element reference in case DOM was updated
    const resultId = searchResults[currentSearchIndex].id;
    const element = document.getElementById(resultId);
    
    if (element) {
      searchResults[currentSearchIndex].element = element;
      element.classList.add('current');
      // Use less aggressive scrolling to prevent layout shifts
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }
}

function updateSearchCounter() {
  if (searchResults.length === 0) {
    searchCounter.textContent = 'No results';
  } else {
    searchCounter.textContent = `${currentSearchIndex + 1} of ${searchResults.length}`;
  }
}

function updateNavigationButtons() {
  const hasResults = searchResults.length > 0;
  searchPrev.disabled = !hasResults;
  searchNext.disabled = !hasResults;
}

function clearDocumentSearch() {
  const content = document.getElementById('content');
  
  // Remove search highlights by replacing them with text nodes
  const existingHighlights = content.querySelectorAll('.search-highlight');
  existingHighlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize(); // Merge adjacent text nodes
  });
  
  searchResults = [];
  currentSearchIndex = -1;
  searchInput.value = '';
  updateSearchCounter();
  updateNavigationButtons();
}

// Drag and drop functionality
const contentArea = document.getElementById('content');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  contentArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
  contentArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  contentArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  contentArea.classList.add('drag-over');
}

function unhighlight(e) {
  contentArea.classList.remove('drag-over');
}

// Handle dropped files
contentArea.addEventListener('drop', handleDrop, false);

async function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    const validExtensions = ['.md', '.markdown', '.txt'];
    const validFiles = [];
    
    // Filter for valid markdown files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExtension)) {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) {
      showNotification('Please drop markdown files (.md, .markdown, or .txt)', 'error');
      return;
    }
    
    // Process all valid files
    for (const file of validFiles) {
      try {
        const content = await readFileContent(file);
        await displayMarkdownFile(content, file.name);
      } catch (error) {
        console.error('Error reading dropped file:', error);
        showNotification(`Error reading file ${file.name}: ${error.message}`, 'error');
      }
    }
    
    if (validFiles.length > 1) {
      showNotification(`Opened ${validFiles.length} files`, 'success');
    }
  }
}

// Helper function to read file content
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Custom Tooltip System
let activeTooltip = null;
let tooltipTimeout = null;

function addCustomTooltip(element, text) {
  element.addEventListener('mouseenter', (e) => {
    // Clear any existing timeout
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    
    // Show tooltip after short delay
    tooltipTimeout = setTimeout(() => {
      showCustomTooltip(e, text);
    }, 300); // 300ms delay (much faster than native)
  });
  
  element.addEventListener('mouseleave', () => {
    // Clear timeout if mouse leaves before showing
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }
    hideCustomTooltip();
  });
  
  element.addEventListener('mousemove', (e) => {
    // Update tooltip position if it's showing
    if (activeTooltip) {
      updateTooltipPosition(e);
    }
  });
}

function showCustomTooltip(event, text) {
  // Remove any existing tooltip
  hideCustomTooltip();
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'custom-tooltip';
  tooltip.textContent = text;
  
  // Add to document
  document.body.appendChild(tooltip);
  activeTooltip = tooltip;
  
  // Position and show
  updateTooltipPosition(event);
  
  // Show with animation
  requestAnimationFrame(() => {
    tooltip.classList.add('show');
  });
}

function updateTooltipPosition(event) {
  if (!activeTooltip) return;
  
  const tooltip = activeTooltip;
  const rect = tooltip.getBoundingClientRect();
  
  // Position above the cursor with some offset
  let x = event.pageX - rect.width / 2;
  let y = event.pageY - rect.height - 10;
  
  // Keep tooltip within viewport
  const padding = 10;
  if (x < padding) x = padding;
  if (x + rect.width > window.innerWidth - padding) {
    x = window.innerWidth - rect.width - padding;
  }
  if (y < padding) {
    y = event.pageY + 10; // Show below cursor if no space above
  }
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

function hideCustomTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}
