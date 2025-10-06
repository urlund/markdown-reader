// Mock electron-updater for tests
module.exports = {
  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(),
    checkForUpdates: jest.fn(),
    downloadUpdate: jest.fn(),
    quitAndInstall: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
  }
};
