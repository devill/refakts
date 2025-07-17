import { CommandOptions, RefactoringCommand } from '../command';
import { ConsoleOutput } from '../interfaces/ConsoleOutput';
import { MoveFileService, MoveFileRequest } from '../services/move-file-service';
import { MoveFileOutputHandler } from '../services/move-file-output-handler';
import * as fs from 'fs';
import * as path from 'path';

export class MoveFileCommand implements RefactoringCommand {
  readonly name = 'move-file';
  readonly description = 'Move a file and update all import references';
  readonly complete = false;
  
  private moveFileService = new MoveFileService();
  private outputHandler!: MoveFileOutputHandler;
  private consoleOutput!: ConsoleOutput;

  async execute(targetLocation: string, _options: CommandOptions): Promise<void> {
    const [sourcePath, destinationPath] = this.parseMoveSyntax(targetLocation);
    this.validateDestinationPathFormat(destinationPath);
    
    const request: MoveFileRequest = { sourcePath, destinationPath };
    const result = await this.moveFileService.moveFile(request);
    this.outputHandler.outputResult(result);
  }

  private parseMoveSyntax(targetLocation: string): [string, string] {
    const parts = targetLocation.trim().split(/\s+/);
    if (parts.length !== 2) {
      throw new Error(`move-file requires exactly two arguments: source and destination paths, got: ${targetLocation}`);
    }
    return [parts[0], parts[1]];
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
      const helpFilePath = path.join(__dirname, 'move-file.help.txt');
      return '\n' + fs.readFileSync(helpFilePath, 'utf8');
    } catch {
      return '\nHelp file not found';
    }
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
    this.outputHandler = new MoveFileOutputHandler(consoleOutput);
  }
}