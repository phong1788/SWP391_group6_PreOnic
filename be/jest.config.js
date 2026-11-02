module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Other test files are empty placeholders until their modules are implemented.
  testMatch: ['**/__tests__/auth.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
