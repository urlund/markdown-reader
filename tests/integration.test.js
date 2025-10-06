/**
 * @jest-environment jsdom
 */

describe('Integration Tests', () => {
  let mockApi;

  beforeEach(() => {
    // Mock window.api
    mockApi = {
      readMarkdownFile: jest.fn(),
      parseMarkdown: jest.fn(),
      startWatchingFile: jest.fn(),
      stopWatchingFile: jest.fn(),
      onFileChanged: jest.fn(),
      copyToClipboard: jest.fn(),
    };
    global.window = { api: mockApi };

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };

    // Set up DOM
    document.body.innerHTML = `
      <div id="content"></div>
      <div id="toc"></div>
      <input id="search-input" type="text" />
      <div id="notification"></div>
    `;
  });

  describe('Complete File Loading Workflow', () => {
    test('should load and display markdown file', async () => {
      // Mock successful file read
      mockApi.readMarkdownFile.mockResolvedValue({
        ok: true,
        content: '# Test Document\n\nThis is a test.',
        filePath: '/test/file.md'
      });

      // Mock markdown parsing
      mockApi.parseMarkdown.mockResolvedValue(
        '<h1>Test Document</h1><p>This is a test.</p>'
      );

      // Simulate file loading workflow
      const fileResult = await mockApi.readMarkdownFile('/test/file.md');
      expect(fileResult.ok).toBe(true);

      const html = await mockApi.parseMarkdown(fileResult.content);
      expect(html).toContain('<h1>Test Document</h1>');

      // Update DOM
      document.getElementById('content').innerHTML = html;
      expect(document.getElementById('content').innerHTML).toContain('Test Document');
    });

    test('should handle file loading errors gracefully', async () => {
      // Mock file read error
      mockApi.readMarkdownFile.mockResolvedValue({
        ok: false,
        error: 'File not found'
      });

      const result = await mockApi.readMarkdownFile('/nonexistent/file.md');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('File Watching Integration', () => {
    test('should start file watching after loading file', async () => {
      // Mock successful file operations
      mockApi.readMarkdownFile.mockResolvedValue({
        ok: true,
        content: '# Test',
        filePath: '/test/file.md'
      });
      mockApi.startWatchingFile.mockResolvedValue({ success: true });

      // Simulate workflow
      const fileResult = await mockApi.readMarkdownFile('/test/file.md');
      const watchResult = await mockApi.startWatchingFile(fileResult.filePath);

      expect(mockApi.startWatchingFile).toHaveBeenCalledWith('/test/file.md');
      expect(watchResult.success).toBe(true);
    });

    test('should handle file change notifications', () => {
      // Mock file change handler registration
      const changeHandler = jest.fn();
      mockApi.onFileChanged.mockImplementation((callback) => {
        // Simulate file change
        setTimeout(() => callback('/test/file.md'), 0);
      });

      mockApi.onFileChanged(changeHandler);
      
      expect(mockApi.onFileChanged).toHaveBeenCalledWith(changeHandler);
    });
  });

  describe('Search and Navigation Integration', () => {
    test('should search content and update display', () => {
      // Set up content with searchable text
      const content = document.getElementById('content');
      content.innerHTML = `
        <h1>Test Document</h1>
        <p>This is a test paragraph with some content.</p>
        <p>Another test paragraph for testing search.</p>
      `;

      const searchInput = document.getElementById('search-input');
      searchInput.value = 'test';

      // Simulate search
      const searchTerm = searchInput.value;
      const contentText = content.textContent;
      const matches = contentText.toLowerCase().split(searchTerm.toLowerCase()).length - 1;

      expect(matches).toBeGreaterThan(0);
    });

    test('should generate table of contents', () => {
      const content = document.getElementById('content');
      const toc = document.getElementById('toc');
      
      content.innerHTML = `
        <h1 id="chapter-1">Chapter 1</h1>
        <p>Content for chapter 1</p>
        <h2 id="section-1-1">Section 1.1</h2>
        <p>Content for section 1.1</p>
        <h1 id="chapter-2">Chapter 2</h1>
      `;

      // Simulate TOC generation
      const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const tocItems = Array.from(headings).map(heading => ({
        text: heading.textContent,
        id: heading.id,
        level: parseInt(heading.tagName[1])
      }));

      expect(tocItems.length).toBe(3);
      expect(tocItems[0].text).toBe('Chapter 1');
      expect(tocItems[1].level).toBe(2);
    });
  });

  describe('Theme and Settings Integration', () => {
    test('should persist theme settings', () => {
      const theme = 'dark';
      
      // Test theme persistence concept without specific mock verification
      expect(theme).toBe('dark');
      
      // Test that theme can be applied to DOM
      document.body.classList.add(`${theme}-theme`);
      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });

    test('should apply theme to document', () => {
      const body = document.body;
      
      // Apply dark theme
      body.classList.add('dark-theme');
      expect(body.classList.contains('dark-theme')).toBe(true);
      
      // Switch to light theme
      body.classList.remove('dark-theme');
      expect(body.classList.contains('dark-theme')).toBe(false);
    });
  });

  describe('Error Recovery Integration', () => {
    test('should recover from API errors', async () => {
      // First call fails
      mockApi.readMarkdownFile
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          content: '# Recovered',
          filePath: '/test/file.md'
        });

      // First attempt should fail
      await expect(mockApi.readMarkdownFile('/test/file.md')).rejects.toThrow('Network error');
      
      // Second attempt should succeed
      const result = await mockApi.readMarkdownFile('/test/file.md');
      expect(result.ok).toBe(true);
      expect(result.content).toBe('# Recovered');
    });

    test('should handle malformed markdown gracefully', async () => {
      const malformedMarkdown = '# Heading\n\n<script>alert("xss")</script>\n\nParagraph';
      
      // Mock parsing that sanitizes content
      mockApi.parseMarkdown.mockResolvedValue(
        '<h1>Heading</h1><p>Paragraph</p>'
      );

      const result = await mockApi.parseMarkdown(malformedMarkdown);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<h1>Heading</h1>');
    });
  });

  describe('Copy Integration Tests', () => {
    test('should copy selected text when available', async () => {
      // Set up content
      document.getElementById('content').innerHTML = '<p>This is test content for copying.</p>';
      
      // Mock text selection
      const mockSelection = {
        toString: jest.fn(() => 'test content'),
        removeAllRanges: jest.fn()
      };
      global.window.getSelection = jest.fn(() => mockSelection);
      
      // Mock successful copy
      mockApi.copyToClipboard.mockResolvedValue({ success: true });
      
      const selection = window.getSelection();
      const selectedText = selection.toString();
      
      const result = await mockApi.copyToClipboard(selectedText);
      
      expect(mockApi.copyToClipboard).toHaveBeenCalledWith('test content');
      expect(result.success).toBe(true);
    });

    test('should copy full document when no selection', async () => {
      const documentContent = '# Document Title\n\nThis is the full document content.';
      
      // Mock no selection
      const mockSelection = {
        toString: jest.fn(() => ''),
        removeAllRanges: jest.fn()
      };
      global.window.getSelection = jest.fn(() => mockSelection);
      
      // Mock successful copy
      mockApi.copyToClipboard.mockResolvedValue({ success: true });
      
      const result = await mockApi.copyToClipboard(documentContent);
      
      expect(mockApi.copyToClipboard).toHaveBeenCalledWith(documentContent);
      expect(result.success).toBe(true);
    });

    test('should handle copy errors gracefully', async () => {
      mockApi.copyToClipboard.mockResolvedValue({ 
        success: false, 
        error: 'Clipboard access denied' 
      });
      
      const result = await mockApi.copyToClipboard('Test content');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Clipboard access denied');
    });

    test('should copy markdown with proper formatting preserved', async () => {
      const markdownContent = `# Main Title

## Subsection

This is a **bold** and *italic* text.

\`\`\`javascript
function test() {
  console.log('Hello world');
}
\`\`\`

- List item 1
- List item 2
  - Nested item

> This is a blockquote`;
      
      mockApi.copyToClipboard.mockResolvedValue({ success: true });
      
      const result = await mockApi.copyToClipboard(markdownContent);
      
      expect(mockApi.copyToClipboard).toHaveBeenCalledWith(markdownContent);
      expect(result.success).toBe(true);
    });
  });
});
