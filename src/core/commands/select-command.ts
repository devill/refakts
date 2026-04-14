import { RefactoringCommand, CommandOptions } from './command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { SelectCommandResult } from './result-types/select-result';
import { ASTService } from '../ast/ast-service';
import { SelectionStrategyFactory } from '../services/selection/selection-strategy-factory';
import { SelectionStrategy } from '../services/selection/selection-strategy';

export class SelectCommand implements RefactoringCommand {
  readonly name = 'select';
  readonly description = 'Find code elements and return their locations with content preview';
  readonly complete = true;

  private consoleOutput!: ConsoleOutput;
  private astService!: ASTService;
  private strategyFactory = new SelectionStrategyFactory();

  async execute(file: string, options: CommandOptions): Promise<SelectCommandResult> {
    const strategy = this.strategyFactory.getStrategy(options);
    strategy.validateOptions(options);
    this.astService = ASTService.createForFile(file);
    return await this.performSelection(file, options, strategy);
  }

  private async performSelection(file: string, options: CommandOptions, strategy: SelectionStrategy): Promise<SelectCommandResult> {
    return new SelectCommandResult(await strategy.select(this.astService.loadSourceFile(file), options));
  }

  validateOptions(options: CommandOptions): void {
    this.strategyFactory.getStrategy(options).validateOptions(options);
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts select src/file.ts --regex "tempResult"\n  refakts select src/file.ts --regex "calculateTotal" --include-definition\n  refakts select src/file.ts --regex "tempResult" --include-line\n  refakts select src/file.ts --regex "tempResult" --preview-line\n  refakts select src/file.ts --range --start-regex "const.*=" --end-regex "return.*"\n  refakts select src/file.ts --regex "user.*" --boundaries "function"\n  refakts select src/file.ts --structural --regex ".*[Uu]ser.*" --include-methods --include-fields';
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}