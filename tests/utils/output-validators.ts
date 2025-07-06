import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';

export class TextOutputValidator {
  private commandExecutor: CommandExecutor;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
  }

  async validate(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateTextCommand(testCase, command);
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
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
    this.writeAndCompareOutput(testCase, textContent);
  }

  private validateErrorTextOutput(testCase: TestCase, error: unknown): void {
    const errorMessage = (error as Error).message;
    this.writeAndCompareOutput(testCase, errorMessage);
  }

  private writeAndCompareOutput(testCase: TestCase, content: string): void {
    fs.writeFileSync(testCase.receivedFile, content);
    
    const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
    const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
    
    expect(received).toBe(expected);
  }

  private extractTextContent(output: string | void): string {
    if (typeof output === 'string') {
      return this.commandExecutor.isUsingCli() ? output.trim() : output.trim();
    }
    return '';
  }

  private cleanupReceivedFile(receivedFile: string): void {
    if (fs.existsSync(receivedFile)) {
      fs.unlinkSync(receivedFile);
    }
  }
}

export class YamlOutputValidator {
  private commandExecutor: CommandExecutor;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
  }

  async validate(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateYamlCommand(testCase, command);
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
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
    fs.writeFileSync(testCase.receivedFile, yamlContent);
    
    const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
    const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
    
    expect(received).toEqual(expected);
  }

  private extractYamlContent(output: string | void): string {
    if (typeof output === 'string') {
      return this.commandExecutor.isUsingCli() ? output.trim() : output;
    }
    return '';
  }

  private cleanupReceivedFile(receivedFile: string): void {
    if (fs.existsSync(receivedFile)) {
      fs.unlinkSync(receivedFile);
    }
  }
}