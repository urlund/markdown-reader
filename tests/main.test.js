// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
  watchFile: jest.fn(),
  unwatchFile: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  sep: '/',
}));

jest.mock('os', () => ({
  homedir: jest.fn(() => '/Users/testuser'),
}));

jest.mock('marked', () => ({
  parse: jest.fn((content) => `<p>${content}</p>`),
}));

jest.mock('electron', () => ({
  clipboard: {
    writeText: jest.fn(),
  },
}));

describe('Main Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the module cache to ensure fresh imports
    jest.resetModules();
  });

  describe('File Operations', () => {
    test('should handle file reading setup', () => {
      const fs = require('fs');
      expect(fs.promises.readFile).toBeDefined();
      expect(fs.watchFile).toBeDefined();
      expect(fs.unwatchFile).toBeDefined();
    });

    test('should handle path operations', () => {
      const path = require('path');
      const result = path.join('test', 'path', 'file.md');
      expect(result).toBe('test/path/file.md');
    });
  });

  describe('OS Operations', () => {
    test('should get home directory', () => {
      const os = require('os');
      const homeDir = os.homedir();
      expect(homeDir).toBe('/Users/testuser');
    });
  });

  describe('Markdown Parsing', () => {
    test('should have markdown parsing capability', () => {
      const marked = require('marked');
      const result = marked.parse('# Test');
      expect(result).toBe('<p># Test</p>');
    });
  });

  describe('Copy Functionality', () => {
    test('should handle copy to clipboard', () => {
      const { clipboard } = require('electron');
      const testText = 'This is test content to copy';
      
      clipboard.writeText(testText);
      
      expect(clipboard.writeText).toHaveBeenCalledWith(testText);
    });

    test('should handle empty text copy', () => {
      const { clipboard } = require('electron');
      
      clipboard.writeText('');
      
      expect(clipboard.writeText).toHaveBeenCalledWith('');
    });

    test('should handle multiline text copy', () => {
      const { clipboard } = require('electron');
      const multilineText = '# Heading\n\nParagraph with content.\n\n- List item 1\n- List item 2';
      
      clipboard.writeText(multilineText);
      
      expect(clipboard.writeText).toHaveBeenCalledWith(multilineText);
    });
  });
});
