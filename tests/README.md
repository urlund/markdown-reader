# Testing Documentation

## Overview

This project uses a comprehensive testing suite to ensure all features work correctly when new functionality is added. The test suite covers all major components and features of the .

## Test Structure

```
tests/
├── setup.js              # Test environment setup
├── mocks/
│   └── electron.js        # Electron API mocks
├── main.test.js           # Main process tests
├── renderer.test.js       # Renderer process tests
├── file-watching.test.js  # File watching tests
└── integration.test.js    # End-to-end integration tests
```

## Running Tests

### Basic Testing
```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Coverage Thresholds
The project maintains the following minimum coverage requirements:
- **Branches**: 70%
- **Functions**: 70% 
- **Lines**: 70%
- **Statements**: 70%

## Test Categories

### 1. Main Process Tests (`main.test.js`)
Tests core Electron main process functionality:
- ✅ File operations (reading, parsing markdown)
- ✅ IPC handlers (file operations, recent files)
- ✅ File watching system (start/stop watching)
- ✅ Menu management and recent files
- ✅ Path formatting and sanitization
- ✅ Error handling for file operations

### 2. Renderer Process Tests (`renderer.test.js`)
Tests the frontend user interface:
- ✅ Tab management (creation, switching, closing)
- ✅ Search functionality (document search, case-sensitive)
- ✅ Table of Contents (generation, search, filtering)
- ✅ Theme management (switching, persistence)
- ✅ Keyboard shortcuts and event handling
- ✅ Settings management and localStorage

### 3. File Watching Tests (`file-watching.test.js`)
Comprehensive tests for the live file monitoring feature:
- ✅ File watcher initialization and cleanup
- ✅ Change detection and notification system
- ✅ Error handling (permissions, file access)
- ✅ Duplicate file watching prevention
- ✅ File content reloading on external changes
- ✅ Notification system for file updates
- ✅ Search state clearing on content changes

### 4. Integration Tests (`integration.test.js`)
End-to-end testing of complete workflows:
- ✅ Complete file opening and processing workflow
- ✅ Search and TOC interaction testing
- ✅ Theme switching and settings persistence
- ✅ Error handling across all components
- ✅ Performance and memory management
- ✅ Cross-component communication

## Test Features Covered

### Core Features
- [x] **Multi-tab Management**: Tab creation, switching, closing, state preservation
- [x] **File Operations**: Opening, reading, parsing, watching
- [x] **Search System**: Document search, TOC search, case-sensitive options
- [x] **Theme Management**: Light/dark themes, persistence, system preference detection
- [x] **Recent Files**: Menu management, path formatting, localStorage persistence

### Advanced Features  
- [x] **Live File Watching**: External change detection, automatic reload, notifications
- [x] **Syntax Highlighting**: Markdown parsing with Prism.js integration
- [x] **DOM-safe Operations**: Search highlighting without HTML corruption
- [x] **Cross-platform Compatibility**: File path handling, keyboard shortcuts
- [x] **Error Handling**: Graceful failure handling across all components

### User Interface
- [x] **Keyboard Shortcuts**: Ctrl+F, Ctrl+T, Escape, navigation keys
- [x] **Visual Feedback**: Notifications, hover states, active indicators
- [x] **Responsive Design**: Layout adaptation, overlay management
- [x] **Accessibility**: Proper event handling, focus management

## Continuous Integration

### GitHub Actions Workflow
The project includes a comprehensive CI/CD pipeline:

**Test Matrix:**
- **Node.js versions**: 16.x, 18.x, 20.x
- **Operating Systems**: Ubuntu, Windows, macOS
- **Test types**: Unit tests, integration tests, build verification

**Workflow Steps:**
1. **Dependency Installation**: Clean npm install across environments
2. **Test Execution**: Full test suite with coverage reporting
3. **Coverage Analysis**: Automatic coverage reporting to Codecov
4. **Cross-platform Testing**: Verification on all supported platforms
5. **Build Verification**: Ensure build process works correctly

### Coverage Reporting
- Coverage reports are automatically generated
- Results uploaded to Codecov for tracking
- Coverage trends monitored over time
- Pull requests include coverage diff

## Adding New Tests

### When Adding New Features
1. **Create feature-specific test file** if it's a major component
2. **Add tests to existing files** for enhancements to existing features
3. **Update integration tests** for cross-component functionality
4. **Ensure minimum coverage thresholds** are maintained

### Test Writing Guidelines
1. **Use descriptive test names** that explain what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Mock external dependencies** (Electron APIs, file system)
4. **Test both success and error scenarios**
5. **Clean up after tests** (clear mocks, reset DOM)

### Example Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks and DOM
  });

  test('should handle normal operation', () => {
    // Arrange: Set up test data
    // Act: Execute the function
    // Assert: Verify expected behavior
  });

  test('should handle error conditions', () => {
    // Test error scenarios
  });
});
```

## Mock System

### Electron API Mocks
Comprehensive mocking of Electron APIs:
- **BrowserWindow**: Window management and web contents
- **ipcMain/ipcRenderer**: Inter-process communication
- **dialog**: File selection dialogs
- **Menu**: Application menu management
- **app**: Application lifecycle events

### File System Mocks
- **fs.promises.readFile**: File reading operations
- **fs.watchFile/unwatchFile**: File monitoring
- **path operations**: Cross-platform path handling

### DOM Mocks
- **localStorage**: Settings persistence
- **window.matchMedia**: Theme detection
- **Event handling**: User interaction simulation

## Best Practices

### Test Maintenance
- **Run tests before commits**: Ensure no regressions
- **Update tests with features**: Keep tests current with code changes
- **Monitor coverage**: Maintain or improve coverage percentages
- **Review test failures**: Investigate and fix failing tests promptly

### Development Workflow
1. **Write tests first** (TDD approach recommended)
2. **Run tests frequently** during development
3. **Use watch mode** for rapid feedback
4. **Check coverage** before submitting pull requests

### Debugging Tests
- Use `npm run test:watch` for rapid iteration
- Add `console.log` statements for debugging (remove before commit)
- Use Jest's `--verbose` flag for detailed output
- Isolate failing tests with `test.only()` or `describe.only()`

## Future Enhancements

### Potential Test Additions
- **Performance testing**: Memory usage, startup time
- **E2E testing**: Full application flow testing
- **Visual regression testing**: UI consistency checks
- **Accessibility testing**: Screen reader compatibility

### Test Infrastructure Improvements
- **Parallel test execution**: Faster test runs
- **Test reporting dashboard**: Better visibility into test results
- **Automated test generation**: AI-assisted test creation
- **Load testing**: File handling performance under stress

This comprehensive testing suite ensures that new features can be added confidently without breaking existing functionality.
