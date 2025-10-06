module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module paths
  moduleFileExtensions: ['js', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'main.js',
    'preload.js',
    'renderer/**/*.js',
    '!renderer/**/*.min.js',
    '!dist/**',
    '!node_modules/**',
    '!tests/**'
  ],
  
  // Coverage thresholds (lowered for initial setup)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Module name mapping for mocking (corrected syntax)
  moduleNameMapper: {
    '^electron$': '<rootDir>/tests/mocks/electron.js',
    '^electron-updater$': '<rootDir>/tests/mocks/electron-updater.js'
  },
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Transform configuration - disable for now since we're not using Babel
  // transform: {
  //   '^.+\\.js$': 'babel-jest'
  // },
};
