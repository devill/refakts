import { CommandExecutor } from './command-executor';
import { TestCase, FixtureTestCase } from './test-case-loader';
import { SingleFileValidator } from './single-file-validator';
import { MultiFileValidator } from './multi-file-validator';
import { TestValidator } from './test-validator';

export class FixtureValidator {
  private singleFileValidator: TestValidator;
  private multiFileValidator: TestValidator;
  
  constructor(commandExecutor: CommandExecutor) {
    this.singleFileValidator = new SingleFileValidator(commandExecutor);
    this.multiFileValidator = new MultiFileValidator(commandExecutor);
  }

  async validate(testCase: TestCase): Promise<void> {
    if (testCase.skip) {
      return;
    }
    
    const validator = this.selectValidator(testCase);
    await validator.validate(testCase);
  }

  private selectValidator(testCase: TestCase): TestValidator {
    if (testCase instanceof FixtureTestCase && testCase.isMultiFile()) {
      return this.multiFileValidator;
    }
    return this.singleFileValidator;
  }
}