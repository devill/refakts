import { verify } from 'approvals';
import { 
  FULL_CLI_HELP, 
  MINIMAL_CLI_HELP, 
  EMPTY_COMMANDS_HELP, 
  MALFORMED_HELP,
  MULTILINE_DESCRIPTION_HELP 
} from './help-output-samples';

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

  test('extracts commands from full CLI help', () => {
    const result = extractCommands(FULL_CLI_HELP);
    verify(__dirname, 'help-parser.extracts commands from full CLI help', result, { reporters: ['donothing'] });
  });

  test('extracts commands from minimal CLI help', () => {
    const result = extractCommands(MINIMAL_CLI_HELP);
    verify(__dirname, 'help-parser.extracts commands from minimal CLI help', result, { reporters: ['donothing'] });
  });

  test('handles empty commands help', () => {
    const result = extractCommands(EMPTY_COMMANDS_HELP);
    verify(__dirname, 'help-parser.handles empty commands help', result, { reporters: ['donothing'] });
  });

  test('handles malformed help output', () => {
    const result = extractCommands(MALFORMED_HELP);
    verify(__dirname, 'help-parser.handles malformed help output', result, { reporters: ['donothing'] });
  });

  test('handles multiline description help', () => {
    const result = extractCommands(MULTILINE_DESCRIPTION_HELP);
    verify(__dirname, 'help-parser.handles multiline description help', result, { reporters: ['donothing'] });
  });
});