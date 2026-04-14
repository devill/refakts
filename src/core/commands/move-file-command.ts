import { CommandOptions, RefactoringCommand } from './command';
import { ConsoleOutput } from '../../command-line-parser/output-formatter/console-output';
import { MoveFileService } from '../transformations/move-file-service';
import { MoveFileCommandResult } from './result-types/move-file-result';
import * as fs from 'fs';
import * as path from 'path';

export class MoveFileCommand implements RefactoringCommand {
  readonly name = 'move-file';
  readonly description = 'Move a file and update all import references';
  readonly complete = true;

  private moveFileService: MoveFileService;
  private consoleOutput!: ConsoleOutput;

  constructor(moveFileService?: MoveFileService) {
    this.moveFileService = moveFileService || new MoveFileService();
  }

  async execute(sourcePath: string, options: CommandOptions): Promise<MoveFileCommandResult> {
    const destinationPath = options.destination as string;
    if (!destinationPath) {
      throw new Error('--destination option is required');
    }
    this.validateDestinationPathFormat(destinationPath);
    const result = await this.moveFileService.moveFile({ sourcePath, destinationPath });
    return new MoveFileCommandResult(result.sourcePath, result.destinationPath, result.referencingFiles, result.sameLocation);
  }

  private validateDestinationPathFormat(destinationPath: string): void {
    if (destinationPath.includes('../..') || destinationPath.startsWith('./../../')) {
      throw new Error(`Invalid destination path: ${destinationPath}`);
    }
  }

  validateOptions(_options: CommandOptions): void {
  }

  getHelpText(): string {
    try {
      return '\n' + fs.readFileSync(path.join(__dirname, 'move-file.help.txt'), 'utf8');
    } catch {
      return '\nHelp file not found';
    }
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}