#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './command-registry';

const program = new Command();
const commandRegistry = new CommandRegistry();

program
  .name('refakts')
  .description('TypeScript refactoring tool based on ts-morph')
  .version('1.0.0');

for (const command of commandRegistry.getAllCommands()) {
  const warningText = !command.complete ? ' (warning: incomplete)' : '';
  
  program
    .command(command.name)
    .description(command.description + warningText)
    .argument('<file>', 'TypeScript file to refactor')
    .option('--query <selector>', 'Target identifier or expression to refactor')
    .option('--to <newName>', 'New name for rename operations')
    .option('--line <number>', 'Line number to target variable declaration')
    .option('--column <number>', 'Column number to target variable declaration')
    .addHelpText('after', command.getHelpText())
    .action(async (file: string, options) => {
      await executeRefactoringCommand(command, file, options);
    });
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

// Handle special case of --help <command> by reordering arguments
const args = process.argv.slice(2);
const helpIndex = args.findIndex(arg => arg === '--help');
const commandIndex = args.findIndex(arg => 
  commandRegistry.getAllCommands().some(cmd => cmd.name === arg)
);

if (helpIndex !== -1 && commandIndex !== -1 && helpIndex < commandIndex) {
  // Reorder to <command> --help format
  const command = args[commandIndex];
  const newArgs = args.filter((_, i) => i !== helpIndex && i !== commandIndex);
  newArgs.unshift(command, '--help');
  process.argv = ['node', 'cli.ts', ...newArgs];
}

program.parse();