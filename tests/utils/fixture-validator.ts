import { CommandExecutor } from './command-executor';
import { TestCase, FixtureTestCase } from './test-case-loader';
import { SingleFileValidator } from './single-file-validator';
import { MultiFileValidator } from './multi-file-validator';

export class FixtureValidator {
  private singleFileValidator: SingleFileValidator;
  private multiFileValidator: MultiFileValidator;
  
  constructor(commandExecutor: CommandExecutor) {
    this.singleFileValidator = new SingleFileValidator(commandExecutor);
    this.multiFileValidator = new MultiFileValidator(commandExecutor);
  }

  async validate(testCase: TestCase): Promise<void> {
    if (testCase instanceof FixtureTestCase && testCase.isMultiFile()) {
      await this.multiFileValidator.validate(testCase);
    } else {
      await this.singleFileValidator.validate(testCase);
    }
  }
}