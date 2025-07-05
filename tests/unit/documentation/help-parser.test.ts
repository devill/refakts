import * as fs from 'fs';
import * as path from 'path';
import { 
  FULL_CLI_HELP, 
  MINIMAL_CLI_HELP, 
  EMPTY_COMMANDS_HELP, 
  MALFORMED_HELP,
  MULTILINE_DESCRIPTION_HELP 
} from '../../fixtures/unit/documentation/help-output-samples';

// Import the private functions from update-readme.ts
// We'll need to extract these to a testable module, but for now we'll copy the logic

function extractCommands(helpOutput: string): string {
  const lines = helpOutput.split('\n');
  const commandsStartIndex = findCommandsStart(lines);
  
  if (commandsStartIndex === -1) return 'No refactoring commands available';
  
  const commands = parseCommandLines(lines, commandsStartIndex);
  return formatCommands(commands);
}

function findCommandsStart(lines: string[]): number {
  return lines.findIndex(line => line.trim() === 'Commands:');
}

function parseCommandLines(lines: string[], startIndex: number): string[] {
  const commands: string[] = [];
  const currentCommand = processLines(lines, startIndex, commands);
  
  if (currentCommand) commands.push(currentCommand);
  return commands;
}

function processLines(lines: string[], startIndex: number, commands: string[]): string {
  let currentCommand = '';
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (shouldStop(line)) break;
    currentCommand = processLine(line, currentCommand, commands);
  }
  return currentCommand;
}

function shouldStop(line: string): boolean {
  return !line || line.includes('help [command]');
}

function processLine(line: string, currentCommand: string, commands: string[]): string {
  if (line.includes('[options]')) {
    if (currentCommand) commands.push(currentCommand);
    return line;
  } else if (currentCommand && line && !line.includes('-h, --help')) {
    return currentCommand + ' ' + line;
  }
  return currentCommand;
}

function formatCommands(commands: string[]): string {
  return commands.length > 0 
    ? commands.map(cmd => '- ' + cmd).join('\n')
    : 'No refactoring commands available';
}

describe('Help Parser', () => {
  const expectedDir = path.join(__dirname, '../../fixtures/unit/documentation');

  test('extracts commands from full CLI help', () => {
    const result = extractCommands(FULL_CLI_HELP);
    const expectedPath = path.join(expectedDir, 'full-cli-help.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('extracts commands from minimal CLI help', () => {
    const result = extractCommands(MINIMAL_CLI_HELP);
    const expectedPath = path.join(expectedDir, 'minimal-cli-help.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles empty commands help', () => {
    const result = extractCommands(EMPTY_COMMANDS_HELP);
    const expectedPath = path.join(expectedDir, 'empty-commands-help.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles malformed help output', () => {
    const result = extractCommands(MALFORMED_HELP);
    const expectedPath = path.join(expectedDir, 'malformed-help.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles multiline description help', () => {
    const result = extractCommands(MULTILINE_DESCRIPTION_HELP);
    const expectedPath = path.join(expectedDir, 'multiline-description-help.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });
});