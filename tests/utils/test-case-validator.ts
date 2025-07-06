import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';

export class TestCaseValidator {
  constructor(private readonly commandExecutor: CommandExecutor) {}

  async validateTextOutput(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      let updatedCommand = command;
      const inputFileName = path.basename(testCase.inputFile);
      updatedCommand = updatedCommand.replace(inputFileName, testCase.inputFile);
      
      try {
        const output = await this.commandExecutor.executeCommand(updatedCommand);
        const textContent = this.extractTextContent(output);
        
        fs.writeFileSync(testCase.receivedFile, textContent);
        
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
        const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
        
        expect(received).toBe(expected);
      } catch (error) {
        const errorMessage = (error as Error).message;
        fs.writeFileSync(testCase.receivedFile, errorMessage);
        
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
        const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
        
        expect(received).toBe(expected);
      }
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
  }

  async validateYamlOutput(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      let updatedCommand = command;
      const inputFileName = path.basename(testCase.inputFile);
      updatedCommand = updatedCommand.replace(inputFileName, testCase.inputFile);
      
      try {
        const output = await this.commandExecutor.executeCommand(updatedCommand);
        let yamlContent: string;
        
        if (typeof output === 'string') {
          yamlContent = this.commandExecutor.isUsingCli() ? output.trim() : output;
        } else {
          yamlContent = '';
        }
        
        fs.writeFileSync(testCase.receivedFile, yamlContent);
        
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
        const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
        
        expect(received).toEqual(expected);
      } catch (error) {
        throw new Error(`Command failed: ${updatedCommand}\n${error}`);
      }
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
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