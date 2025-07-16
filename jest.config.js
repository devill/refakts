module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  maxWorkers: '50%', // Reduce parallelism to avoid file conflicts
  globalSetup: './tests/jest-global-setup.js',
  setupFilesAfterEnv: ['./tests/jest-setup-after-env.js'],
};