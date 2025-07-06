import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';
import { FileOperations } from './file-operations';

export class TextOutputValidator {
  private commandExecutor: CommandExecutor;
  private fileOps: FileOperations;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.fileOps = new FileOperations();
  }

  async validate(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateTextCommand(testCase, command);
    }
    
    this.fileOps.cleanupReceivedFile(testCase.receivedFile);
  }

  private async executeAndValidateTextCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.updateCommandPath(command, testCase.inputFile);
    
    try {
      const output = await this.commandExecutor.executeCommand(updatedCommand);
      this.validateSuccessTextOutput(testCase, output);
    } catch (error) {
      this.validateErrorTextOutput(testCase, error);
    }
  }

  private updateCommandPath(command: string, inputFile: string): string {
    const inputFileName = path.basename(inputFile);
    return command.replace(inputFileName, inputFile);
  }

  private validateSuccessTextOutput(testCase: TestCase, output: string | void): void {
    const textContent = this.extractTextContent(output);
    this.fileOps.writeAndCompareOutput(testCase, textContent);
  }

  private validateErrorTextOutput(testCase: TestCase, error: unknown): void {
    const errorMessage = (error as Error).message;
    this.fileOps.writeAndCompareOutput(testCase, errorMessage);
  }

  private extractTextContent(output: string | void): string {
    if (typeof output === 'string') {
      return this.commandExecutor.isUsingCli() ? output.trim() : output.trim();
    }
    return '';
  }
}

export class YamlOutputValidator {
  private commandExecutor: CommandExecutor;
  private fileOps: FileOperations;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.fileOps = new FileOperations();
  }

  async validate(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateYamlCommand(testCase, command);
    }
    
    this.fileOps.cleanupReceivedFile(testCase.receivedFile);
  }

  private async executeAndValidateYamlCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.updateCommandPath(command, testCase.inputFile);
    
    try {
      const output = await this.commandExecutor.executeCommand(updatedCommand);
      this.validateYamlCommandOutput(testCase, output);
    } catch (error) {
      throw new Error(`Command failed: ${updatedCommand}\n${error}`);
    }
  }

  private updateCommandPath(command: string, inputFile: string): string {
    const inputFileName = path.basename(inputFile);
    return command.replace(inputFileName, inputFile);
  }

  private validateYamlCommandOutput(testCase: TestCase, output: string | void): void {
    const yamlContent = this.extractYamlContent(output);
    this.fileOps.writeAndCompareYamlOutput(testCase, yamlContent);
  }

  private extractYamlContent(output: string | void): string {
    if (typeof output === 'string') {
      return this.commandExecutor.isUsingCli() ? output.trim() : output;
    }
    return '';
  }
}