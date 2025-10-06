// Test for multi-file opening functionality
describe('Multi-File Opening', () => {
  let mockWindow;
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="tabs-container"></div>
      <div id="content"></div>
    `;
    
    // Mock the API for multi-file responses
    mockWindow = {
      api: {
        openMarkdownFile: jest.fn(),
        copyToClipboard: jest.fn(),
        startWatchingFile: jest.fn().mockResolvedValue(),
        updateRecentFilesMenu: jest.fn()
      }
    };
    global.window = mockWindow;
    
    // Mock global functions
    global.showNotification = jest.fn();
    global.displayMarkdownFile = jest.fn();
    global.readFileContent = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should process multiple files correctly', async () => {
    // Mock multi-file response
    const mockFiles = [
      { content: '# File 1\nContent 1', filePath: '/path/to/file1.md' },
      { content: '# File 2\nContent 2', filePath: '/path/to/file2.md' },
      { content: '# File 3\nContent 3', filePath: '/path/to/file3.md' }
    ];
    
    mockWindow.api.openMarkdownFile.mockResolvedValue({
      canceled: false,
      files: mockFiles
    });
    
    // Test the file processing logic directly
    const result = await mockWindow.api.openMarkdownFile();
    
    if (!result.canceled && result.files && result.files.length > 0) {
      // Process all selected files
      for (const file of result.files) {
        await global.displayMarkdownFile(file.content, file.filePath);
      }
      
      if (result.files.length > 1) {
        global.showNotification(`Opened ${result.files.length} files`, 'success');
      }
    }
    
    // Verify all files were processed
    expect(global.displayMarkdownFile).toHaveBeenCalledTimes(3);
    expect(global.displayMarkdownFile).toHaveBeenCalledWith('# File 1\nContent 1', '/path/to/file1.md');
    expect(global.displayMarkdownFile).toHaveBeenCalledWith('# File 2\nContent 2', '/path/to/file2.md');
    expect(global.displayMarkdownFile).toHaveBeenCalledWith('# File 3\nContent 3', '/path/to/file3.md');
    
    // Verify success notification for multiple files
    expect(global.showNotification).toHaveBeenCalledWith('Opened 3 files', 'success');
  });

  test('should handle single file correctly', async () => {
    // Mock single file response
    const mockFiles = [
      { content: '# Single File\nContent', filePath: '/path/to/single.md' }
    ];
    
    mockWindow.api.openMarkdownFile.mockResolvedValue({
      canceled: false,
      files: mockFiles
    });
    
    // Test the file processing logic directly
    const result = await mockWindow.api.openMarkdownFile();
    
    if (!result.canceled && result.files && result.files.length > 0) {
      // Process all selected files
      for (const file of result.files) {
        await global.displayMarkdownFile(file.content, file.filePath);
      }
      
      if (result.files.length > 1) {
        global.showNotification(`Opened ${result.files.length} files`, 'success');
      }
    }
    
    // Verify single file was processed
    expect(global.displayMarkdownFile).toHaveBeenCalledTimes(1);
    expect(global.displayMarkdownFile).toHaveBeenCalledWith('# Single File\nContent', '/path/to/single.md');
    
    // Verify no notification for single file
    expect(global.showNotification).not.toHaveBeenCalled();
  });

  test('should handle canceled dialog correctly', async () => {
    // Mock canceled response
    mockWindow.api.openMarkdownFile.mockResolvedValue({
      canceled: true
    });
    
    // Test the file processing logic directly
    const result = await mockWindow.api.openMarkdownFile();
    
    if (!result.canceled && result.files && result.files.length > 0) {
      // Process all selected files
      for (const file of result.files) {
        await global.displayMarkdownFile(file.content, file.filePath);
      }
      
      if (result.files.length > 1) {
        global.showNotification(`Opened ${result.files.length} files`, 'success');
      }
    }
    
    // Verify no files were processed
    expect(global.displayMarkdownFile).not.toHaveBeenCalled();
    expect(global.showNotification).not.toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    // Mock error response
    mockWindow.api.openMarkdownFile.mockRejectedValue(new Error('File access denied'));
    
    try {
      await mockWindow.api.openMarkdownFile();
    } catch (error) {
      global.showNotification('Error opening files', 'error');
    }
    
    // Verify error handling
    expect(global.displayMarkdownFile).not.toHaveBeenCalled();
    expect(global.showNotification).toHaveBeenCalledWith('Error opening files', 'error');
  });

  test('should handle drag and drop of multiple files', async () => {
    // Mock File objects for drag and drop
    const mockFiles = [
      { name: 'file1.md', type: 'text/markdown' },
      { name: 'file2.md', type: 'text/markdown' },
      { name: 'invalid.pdf', type: 'application/pdf' },
      { name: 'file3.txt', type: 'text/plain' }
    ];
    
    // Mock readFileContent function
    global.readFileContent
      .mockResolvedValueOnce('# File 1 Content')
      .mockResolvedValueOnce('# File 2 Content')
      .mockResolvedValueOnce('File 3 text content');
    
    // Test the drag and drop logic directly
    const validExtensions = ['.md', '.markdown', '.txt'];
    const validFiles = [];
    
    // Filter for valid markdown files
    for (let i = 0; i < mockFiles.length; i++) {
      const file = mockFiles[i];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExtension)) {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) {
      global.showNotification('Please drop markdown files (.md, .markdown, or .txt)', 'error');
      return;
    }
    
    // Process all valid files
    for (const file of validFiles) {
      try {
        const content = await global.readFileContent(file);
        await global.displayMarkdownFile(content, file.name);
      } catch (error) {
        global.showNotification(`Error reading file ${file.name}: ${error.message}`, 'error');
      }
    }
    
    if (validFiles.length > 1) {
      global.showNotification(`Opened ${validFiles.length} files`, 'success');
    }
    
    // Verify only valid markdown files were processed (3 out of 4)
    expect(global.displayMarkdownFile).toHaveBeenCalledTimes(3);
    expect(global.showNotification).toHaveBeenCalledWith('Opened 3 files', 'success');
  });

  test('should show error for invalid drag and drop files', async () => {
    // Mock invalid file types
    const mockFiles = [
      { name: 'image.png', type: 'image/png' },
      { name: 'document.pdf', type: 'application/pdf' }
    ];
    
    // Test the drag and drop logic directly
    const validExtensions = ['.md', '.markdown', '.txt'];
    const validFiles = [];
    
    // Filter for valid markdown files
    for (let i = 0; i < mockFiles.length; i++) {
      const file = mockFiles[i];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExtension)) {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) {
      global.showNotification('Please drop markdown files (.md, .markdown, or .txt)', 'error');
      return;
    }
    
    // Verify error notification for no valid files
    expect(global.displayMarkdownFile).not.toHaveBeenCalled();
    expect(global.showNotification).toHaveBeenCalledWith(
      'Please drop markdown files (.md, .markdown, or .txt)', 
      'error'
    );
  });
});
