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
      console.error(`❌ Command '${commandName}' is not currently marked as incomplete.`);
      console.log(`Available incomplete commands: ${incompleteRefactorings.join(', ')}`);
      process.exit(1);
    }
    
    snoozeCheck('incompleteRefactoring', commandName);
    console.log(`✅ Snoozed incomplete refactoring alerts for '${commandName}' for 24 hours.`);
  });

program
  .command('clear')
  .description('Clear all expired snoozes')
  .action(() => {
    clearExpiredSnoozes();
    console.log('✅ Cleared all expired snoozes.');
  });

program.parse();