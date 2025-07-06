import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';
import { FileOperations } from './file-operations';

export class RefactoringValidator {
  private commandExecutor: CommandExecutor;
  private fileOps: FileOperations;

  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.fileOps = new FileOperations();
  }

  async validate(testCase: TestCase): Promise<void> {
    const isErrorCase = testCase.expectedFile.endsWith('.txt');
    
    if (isErrorCase) {
      await this.validateErrorCase(testCase);
    } else {
      await this.validateSuccessCase(testCase);
    }
  }

  private async validateErrorCase(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateErrorCommand(testCase, command);
    }
    
    this.fileOps.cleanupReceivedFile(testCase.receivedFile);
  }

  private async executeAndValidateErrorCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.prepareErrorCommand(command, testCase.inputFile);
    
    try {
      await this.commandExecutor.executeCommand(updatedCommand);
      throw new Error(`Expected command to fail but it succeeded: ${updatedCommand}`);
    } catch (error) {
      this.handleExpectedError(testCase, error);
    }
  }

  private prepareErrorCommand(command: string, inputFile: string): string {
    const cleanCommand = command.replace('refakts', '').trim();
    const inputFileName = path.basename(inputFile);
    return cleanCommand.replace(inputFileName, inputFile);
  }

  private handleExpectedError(testCase: TestCase, error: unknown): void {
    const errorMessage = this.extractCoreErrorMessage((error as Error).message);
    this.fileOps.writeAndCompareOutput(testCase, errorMessage);
  }

  private async validateSuccessCase(testCase: TestCase): Promise<void> {
    this.fileOps.setupTestFiles(testCase);
    await this.executeRefactoringCommands(testCase);
    this.fileOps.validateResults(testCase);
    this.fileOps.cleanupRefactoringFiles(testCase.receivedFile);
  }

  private async executeRefactoringCommands(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeRefactoringCommand(testCase, command);
    }
  }

  private async executeRefactoringCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.prepareRefactoringCommand(testCase, command);
    
    try {
      await this.commandExecutor.executeCommand(updatedCommand);
    } catch (error) {
      throw new Error(`Command failed: ${updatedCommand}\n${error}`);
    }
  }

  private prepareRefactoringCommand(testCase: TestCase, command: string): string {
    let updatedCommand = command.replace('refakts', '').trim();
    
    if (fs.statSync(testCase.inputFile).isFile()) {
      const inputFileName = path.basename(testCase.inputFile);
      updatedCommand = updatedCommand.replace(inputFileName, testCase.receivedFile);
    }
    
    return updatedCommand;
  }


  private extractCoreErrorMessage(errorMessage: string): string {
    if (errorMessage.startsWith('Command execution failed:')) {
      return this.extractFromFailedCommand(errorMessage);
    }
    
    return this.ensureErrorPrefix(errorMessage);
  }

  private extractFromFailedCommand(errorMessage: string): string {
    const lines = errorMessage.split('\n');
    if (lines.length > 1) {
      const coreMessage = lines.slice(1).join('\n');
      return this.ensureErrorPrefix(coreMessage);
    }
    return this.ensureErrorPrefix(errorMessage);
  }

  private ensureErrorPrefix(message: string): string {
    return message.startsWith('Error: ') ? message : `Error: ${message}`;
  }
}