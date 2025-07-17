import { RefactoringCommand, CommandOptions } from '../command';
import { ConsoleOutput } from '../interfaces/ConsoleOutput';
import { SelectOutputHandler } from '../services/selection/output-handler';
import { ASTService } from '../services/ast-service';
import { SelectionStrategyFactory } from '../strategies/selection-strategy-factory';
import { SelectionStrategy } from '../strategies/selection-strategy';

export class SelectCommand implements RefactoringCommand {
  readonly name = 'select';
  readonly description = 'Find code elements and return their locations with content preview';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService = new ASTService();
  private strategyFactory = new SelectionStrategyFactory();
  private outputHandler!: SelectOutputHandler;

  async execute(file: string, options: CommandOptions): Promise<void> {
    const strategy = this.strategyFactory.getStrategy(options);
    strategy.validateOptions(options);
    await this.performSelection(file, options, strategy);
  }

  private async performSelection(file: string, options: CommandOptions, strategy: SelectionStrategy): Promise<void> {
    const sourceFile = this.astService.loadSourceFile(file);
    const results = await strategy.select(sourceFile, options);
    this.outputHandler.outputResults(results);
  }

  validateOptions(options: CommandOptions): void {
    const strategy = this.strategyFactory.getStrategy(options);
    strategy.validateOptions(options);
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts select src/file.ts --regex "tempResult"\n  refakts select src/file.ts --regex "calculateTotal" --include-definition\n  refakts select src/file.ts --regex "tempResult" --include-line\n  refakts select src/file.ts --regex "tempResult" --preview-line\n  refakts select src/file.ts --range --start-regex "const.*=" --end-regex "return.*"\n  refakts select src/file.ts --regex "user.*" --boundaries "function"\n  refakts select src/file.ts --structural --regex ".*[Uu]ser.*" --include-methods --include-fields';
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
    this.outputHandler = new SelectOutputHandler(consoleOutput);
  }
}