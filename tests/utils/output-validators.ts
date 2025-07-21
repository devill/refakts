import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';
import { FileOperations } from './file-operations';

abstract class BaseOutputValidator {
  protected commandExecutor: CommandExecutor;
  protected fileOps: FileOperations;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.fileOps = new FileOperations();
  }

  async validate(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateCommand(testCase, command);
    }
    
    this.fileOps.cleanupReceivedFile(testCase.receivedFile);
  }

  private async executeAndValidateCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.updateCommandPath(command, testCase.inputFile);
    
    try {
      const output = await this.commandExecutor.executeCommand(updatedCommand);
      this.handleSuccessOutput(testCase, output);
    } catch (error) {
      this.handleErrorOutput(testCase, error);
    }
  }

  private updateCommandPath(command: string, inputFile: string): string {
    const inputFileName = path.basename(inputFile);
    return command.replace(inputFileName, inputFile);
  }

  // eslint-disable-next-line no-unused-vars
  protected abstract handleSuccessOutput(testCase: TestCase, output: string | void): void;
  // eslint-disable-next-line no-unused-vars
  protected abstract handleErrorOutput(testCase: TestCase, error: unknown): void;
}

export class TextOutputValidator extends BaseOutputValidator {
  protected handleSuccessOutput(testCase: TestCase, output: string | void): void {
    const textContent = this.extractTextContent(output);
    this.fileOps.writeAndCompareOutput(testCase, textContent);
  }

  protected handleErrorOutput(testCase: TestCase, error: unknown): void {
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

export class YamlOutputValidator extends BaseOutputValidator {
  protected handleSuccessOutput(testCase: TestCase, output: string | void): void {
    const yamlContent = this.extractYamlContent(output);
    this.fileOps.writeAndCompareYamlOutput(testCase, yamlContent);
  }

  protected handleErrorOutput(_testCase: TestCase, error: unknown): void {
    const updatedCommand = '';
    throw new Error(`Command failed: ${updatedCommand}\n${error}`);
  }

  private extractYamlContent(output: string | void): string {
    if (typeof output === 'string') {
      return this.commandExecutor.isUsingCli() ? output.trim() : output;
    }
    return '';
  }
}