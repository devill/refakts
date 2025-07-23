import { CommandOptions, RefactoringCommand } from './command';
import { ConsoleOutput } from '../../interfaces/ConsoleOutput';
import { MoveFileService, MoveFileRequest } from '../transformations/move-file-service';
import { MoveFileOutputHandler } from '../../services/move-file-output-handler';
import * as fs from 'fs';
import * as path from 'path';

export class MoveFileCommand implements RefactoringCommand {
  readonly name = 'move-file';
  readonly description = 'Move a file and update all import references';
  readonly complete = true;
  
  private moveFileService: MoveFileService;
  private outputHandler!: MoveFileOutputHandler;
  private consoleOutput!: ConsoleOutput;

  constructor(moveFileService?: MoveFileService) {
    this.moveFileService = moveFileService || new MoveFileService();
  }

  async execute(sourcePath: string, options: CommandOptions): Promise<void> {
    const destinationPath = options.destination as string;
    if (!destinationPath) {
      throw new Error('--destination option is required');
    }
    
    this.validateDestinationPathFormat(destinationPath);
    
    const request: MoveFileRequest = { sourcePath, destinationPath };
    const result = await this.moveFileService.moveFile(request);
    this.outputHandler.outputResult(result);
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