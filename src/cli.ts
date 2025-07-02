#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './command-registry';
import { CommandOption } from './command';
import { UsageTracker } from './usage-tracker';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();
const commandRegistry = new CommandRegistry();

program
  .name('refakts')
  .description('TypeScript refactoring tool based on ts-morph')
  .version('1.0.0');

for (const command of commandRegistry.getAllCommands()) {
  const warningText = !command.complete ? ' (warning: incomplete)' : '';
  
  const cmd = program
    .command(command.name)
    .description(command.description + warningText)
    .argument('<file>', 'TypeScript file to refactor');
  
  addCommandOptions(cmd, command);
  
  cmd
    .addHelpText('after', command.getHelpText())
    .action(async (file: string, options) => {
      UsageTracker.logUsage(command.name, process.argv.slice(2));
      await executeRefactoringCommand(command, file, options);
    });
}

function addCommandOptions(cmd: any, command: any): void {
  const options = loadCommandOptions(command.name);
  for (const option of options) {
    cmd.option(option.flags, option.description);
  }
}

function loadCommandOptions(commandName: string): CommandOption[] {
  const optionsPath = path.join(__dirname, 'commands', `${commandName}-options.json`);
  try {
    const optionsData = fs.readFileSync(optionsPath, 'utf8');
    return JSON.parse(optionsData) as CommandOption[];
  } catch (error) {
    console.error(`Failed to load options for command ${commandName}:`, error);
    return [];
  }
}

async function executeRefactoringCommand(command: any, file: string, options: any): Promise<void> {
  try {
    command.validateOptions(options);
    await command.execute(file, options);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
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