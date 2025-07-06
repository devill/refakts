import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';
import { TextOutputValidator, YamlOutputValidator } from './output-validators';
import { RefactoringValidator } from './refactoring-validator';

export class TestCaseValidator {
  private readonly commandExecutor: CommandExecutor;
  private readonly textValidator: TextOutputValidator;
  private readonly yamlValidator: YamlOutputValidator;
  private readonly refactoringValidator: RefactoringValidator;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.textValidator = new TextOutputValidator(commandExecutor);
    this.yamlValidator = new YamlOutputValidator(commandExecutor);
    this.refactoringValidator = new RefactoringValidator(commandExecutor);
  }

  async validateTextOutput(testCase: TestCase): Promise<void> {
    await this.textValidator.validate(testCase);
  }

  async validateYamlOutput(testCase: TestCase): Promise<void> {
    await this.yamlValidator.validate(testCase);
  }

  async validateRefactoringOutput(testCase: TestCase): Promise<void> {
    await this.refactoringValidator.validate(testCase);
  }
}