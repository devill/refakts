#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './command-registry';
import { CommandOption, CommandOptions, RefactoringCommand } from './command';
import { UsageTracker } from './usage-tracker';
import { LocationParser } from './core/location-range';
import { StandardConsole } from './interfaces/StandardConsole';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();
const showIncomplete = process.argv.includes('--show-incomplete');
const commandRegistry = new CommandRegistry(new StandardConsole(), showIncomplete);

program
  .name('refakts')
  .description('TypeScript refactoring tool based on ts-morph')
  .version('1.0.0')
  .option('--show-incomplete', 'Show incomplete commands in help');

for (const command of commandRegistry.getAllCommands()) {
  const warningText = !command.complete ? ' (warning: incomplete)' : '';
  const cmd = program
    .command(command.name)
    .description(command.description + warningText)
    .argument('<target>', 'TypeScript file or location format [file.ts line:col-line:col]');
  
  addCommandOptions(cmd, command);
  
  cmd
    .addHelpText('after', command.getHelpText())
    .action(async (target: string, options) => {
      UsageTracker.logUsage(command.name, process.argv.slice(2));
      await executeRefactoringCommand(command, target, options);
    });
}

function addCommandOptions(cmd: Command, command: RefactoringCommand): void {
  const options = loadCommandOptions(command.name);
  for (const option of options) {
    cmd.option(option.flags, option.description);
  }
}

function loadCommandOptions(commandName: string): CommandOption[] {
  const optionsPath = getOptionsPath(commandName);
  return readOptionsFile(optionsPath, commandName);
}

function getOptionsPath(commandName: string): string {
  return path.join(__dirname, 'commands', `${commandName}-options.json`);
}

function readOptionsFile(optionsPath: string, commandName: string): CommandOption[] {
  try {
    const optionsData = fs.readFileSync(optionsPath, 'utf8');
    return JSON.parse(optionsData) as CommandOption[];
  } catch (error) {
    process.stderr.write(`Failed to load options for command ${commandName}: ${error}\n`);
    return [];
  }
}

async function executeRefactoringCommand(command: RefactoringCommand, target: string, options: CommandOptions): Promise<void> {
  try {
    await executeCommandWithTarget(command, target, options);
  } catch (error) {
    handleCommandError(error);
  }
}

async function executeCommandWithTarget(command: RefactoringCommand, target: string, options: CommandOptions): Promise<void> {
  if (LocationParser.isLocationFormat(target)) {
    await executeWithLocationTarget(command, target, options);
  } else {
    await executeWithFileTarget(command, target, options);
  }
}

async function executeWithLocationTarget(command: RefactoringCommand, target: string, options: CommandOptions): Promise<void> {
  const location = LocationParser.parseLocation(target);
  const optionsWithLocation = { ...options, location };
  command.validateOptions(optionsWithLocation);
  await command.execute(location.file, optionsWithLocation);
}

async function executeWithFileTarget(command: RefactoringCommand, target: string, options: CommandOptions): Promise<void> {
  command.validateOptions(options);
  await command.execute(target, options);
}

function handleCommandError(error: unknown): void {
   
  process.stderr.write(`Error: ${(error as Error).message}\n`);
  process.exit(1);
}

function reorderHelpCommandArguments(): void {
  const args = process.argv.slice(2);
  const helpIndex = args.findIndex(arg => arg === '--help');
  const commandIndex = findCommandArgumentIndex(args);

  if (shouldReorderArguments(helpIndex, commandIndex)) {
    const reorderedArgs = createReorderedArguments(args, helpIndex, commandIndex);
    process.argv = ['node', 'cli.ts', ...reorderedArgs];
  }
}

function findCommandArgumentIndex(args: string[]): number {
  return args.findIndex(arg => 
    commandRegistry.getAllCommands().some(cmd => cmd.name === arg)
  );
}

function shouldReorderArguments(helpIndex: number, commandIndex: number): boolean {
  return helpIndex !== -1 && commandIndex !== -1 && helpIndex < commandIndex;
}

function createReorderedArguments(args: string[], helpIndex: number, commandIndex: number): string[] {
  const command = args[commandIndex];
  const filteredArgs = args.filter((_, i) => i !== helpIndex && i !== commandIndex);
  return [command, '--help', ...filteredArgs];
}

reorderHelpCommandArguments();

program.parse();