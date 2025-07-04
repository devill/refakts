#!/usr/bin/env node

import { Command } from 'commander';
import { snoozeCheck, clearExpiredSnoozes } from './quality-tools/snooze-tracker';
import { getIncompleteRefactorings } from './cli-generator';

const program = new Command();

program
  .name('refakts-snooze')
  .description('Manage quality check snoozing')
  .version('1.0.0');

program
  .command('incomplete')
  .argument('<command>', 'Name of the incomplete refactoring command to snooze')
  .description('Snooze incomplete refactoring alerts for a specific command for 24 hours')
  .action((commandName: string) => {
    const incompleteRefactorings = getIncompleteRefactorings();
    
    if (!incompleteRefactorings.includes(commandName)) {
      process.stderr.write(`❌ Command '${commandName}' is not currently marked as incomplete.\n`);
      process.stdout.write(`Available incomplete commands: ${incompleteRefactorings.join(', ')}\n`);
      process.exit(1);
    }
    
    snoozeCheck('incompleteRefactoring', commandName);
    process.stdout.write(`✅ Snoozed incomplete refactoring alerts for '${commandName}' for 24 hours.\n`);
  });

program
  .command('clear')
  .description('Clear all expired snoozes')
  .action(() => {
    clearExpiredSnoozes();
    process.stdout.write('✅ Cleared all expired snoozes.\n');
  });

program.parse();