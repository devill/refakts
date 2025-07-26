import { FixtureProtection } from '../../../src/core/services/fixture-protection';

describe('FixtureProtection', () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  describe('validateFile', () => {
    it('should allow non-fixture files', () => {
      expect(() => {
        FixtureProtection.validateFile('/src/some-file.ts');
      }).not.toThrow();
    });

    it('should allow fixture files in test context (Jest environment)', () => {
      process.env.NODE_ENV = 'test';
      
      expect(() => {
        FixtureProtection.validateFile('/tests/fixtures/some-fixture.ts');
      }).not.toThrow();
    });

    it('should allow fixture files when JEST_WORKER_ID is set', () => {
      process.env.JEST_WORKER_ID = '1';
      
      expect(() => {
        FixtureProtection.validateFile('/tests/fixtures/some-fixture.ts');
      }).not.toThrow();
    });

    it('should allow fixture files when running jest command', () => {
      process.argv = ['node', 'jest', 'test'];
      
      expect(() => {
        FixtureProtection.validateFile('/tests/fixtures/some-fixture.ts');
      }).not.toThrow();
    });

    it('should block fixture files outside test context', () => {
      delete process.env.NODE_ENV;
      delete process.env.JEST_WORKER_ID;
      process.argv = ['node', 'cli.ts'];
      
      expect(() => {
        FixtureProtection.validateFile('/tests/fixtures/some-fixture.ts');
      }).toThrow('Cannot execute refakts on fixture files outside test context');
    });

    it('should provide detailed error message for blocked fixture', () => {
      delete process.env.NODE_ENV;
      delete process.env.JEST_WORKER_ID;
      process.argv = ['node', 'cli.ts'];
      
      try {
        FixtureProtection.validateFile('/tests/fixtures/commands/select/test.ts');
      } catch (error) {
        expect((error as Error).message).toContain('Cannot execute refakts on fixture files outside test context');
        expect((error as Error).message).toContain('/tests/fixtures/commands/select/test.ts');
        expect((error as Error).message).toContain('Fixture files are test data');
      }
    });
  });
});