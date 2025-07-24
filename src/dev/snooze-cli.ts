#!/usr/bin/env node

import { Command } from 'commander';
import { clearExpiredSnoozes } from '../quality-tools/snooze-tracker';

const program = new Command();

program
  .name('refakts-snooze')
  .description('Manage quality check snoozing')
  .version('1.0.0');


program
  .command('clear')
  .description('Clear all expired snoozes')
  .action(() => {
    clearExpiredSnoozes();
    process.stdout.write('✅ Cleared all expired snoozes.\n');
  });

program.parse();