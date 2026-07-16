import { describe, it, expect } from '@jest/globals';
import * as path from 'path';
import { CircularDependencyValidator } from '../../../src/core/services/circular-dependency-validator';
import { ImportReferenceService } from '../../../src/core/services/import-reference-service';

const buildService = (importsFrom: boolean, spy?: jest.Mock): ImportReferenceService =>
  ({ checkFileImportsFrom: spy ?? jest.fn().mockReturnValue(importsFrom) } as unknown as ImportReferenceService);

describe('CircularDependencyValidator', () => {
  const sourcePath = path.resolve('/project/src/source.ts');
  const destinationPath = path.resolve('/project/lib/moved.ts');

  it('passes when there are no referencing files', () => {
    const validator = new CircularDependencyValidator(buildService(true));
    expect(() => validator.validate(sourcePath, destinationPath, [])).not.toThrow();
  });

  it('passes when the referencing file lives in a different directory', () => {
    const spy = jest.fn().mockReturnValue(true);
    const validator = new CircularDependencyValidator(buildService(true, spy));
    const referencingFile = path.resolve('/project/other/consumer.ts');

    validator.validate(sourcePath, destinationPath, [referencingFile]);

    expect(spy).not.toHaveBeenCalled();
  });

  it('passes when a same-directory referencing file does not import from the source', () => {
    const validator = new CircularDependencyValidator(buildService(false));
    const referencingFile = path.resolve('/project/lib/consumer.ts');

    expect(() => validator.validate(sourcePath, destinationPath, [referencingFile])).not.toThrow();
  });

  it('throws when a same-directory referencing file imports from the source', () => {
    const validator = new CircularDependencyValidator(buildService(true));
    const referencingFile = path.resolve('/project/lib/consumer.ts');

    expect(() => validator.validate(sourcePath, destinationPath, [referencingFile]))
      .toThrow('would create circular dependency');
  });
});
