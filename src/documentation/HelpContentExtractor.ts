import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export class HelpContentExtractor {
  async extractHelpContent(): Promise<string> {
    try {
      const { stdout } = await execAsync('ts-node src/cli.ts --help', {
        cwd: path.join(__dirname, '..', '..')
      });
      return this.parseCommands(stdout);
    } catch {
      return 'Error: Could not generate help output';
    }
  }

  private parseCommands(helpOutput: string): string {
    const lines = helpOutput.split('\n');
    const commandsStartIndex = this.findCommandsStart(lines);
    
    if (commandsStartIndex === -1) return 'No refactoring commands available';
    
    const commands = this.extractCommandLines(lines, commandsStartIndex);
    return this.formatCommands(commands);
  }

  private findCommandsStart(lines: string[]): number {
    return lines.findIndex(line => line.trim() === 'Commands:');
  }

  private extractCommandLines(lines: string[], startIndex: number): string[] {
    const commands: string[] = [];
    const currentCommand = this.processLines(lines, startIndex, commands);
    
    if (currentCommand) commands.push(currentCommand);
    return commands;
  }

  private processLines(lines: string[], startIndex: number, commands: string[]): string {
    let currentCommand = '';
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (this.shouldStopProcessing(line)) break;
      currentCommand = this.processLine(line, currentCommand, commands);
    }
    return currentCommand;
  }

  private shouldStopProcessing(line: string): boolean {
    return !line || line.includes('help [command]');
  }

  private processLine(line: string, currentCommand: string, commands: string[]): string {
    if (line.includes('[options]')) {
      if (currentCommand) commands.push(currentCommand);
      return line;
    } else if (currentCommand && line && !line.includes('-h, --help')) {
      return currentCommand + ' ' + line;
    }
    return currentCommand;
  }

  private formatCommands(commands: string[]): string {
    return commands.length > 0 
      ? commands.map(cmd => '- ' + cmd).join('\n')
      : 'No refactoring commands available';
  }
}