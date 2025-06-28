#!/usr/bin/env node

import { Command } from 'commander';
import { RefactorEngine } from './refactor-engine';

const program = new Command();

program
  .name('refakts')
  .description('TypeScript refactoring tool based on ts-morph')
  .version('1.0.0');

program
  .command('inline-variable')
  .description('Inline a variable using TSQuery selector')
  .argument('<file>', 'TypeScript file to refactor')
  .option('--query <selector>', 'TSQuery selector to find the variable')
  .action(async (file: string, options) => {
    const engine = new RefactorEngine();
    
    if (options.query) {
      await engine.inlineVariableByQuery(file, options.query);
    } else {
      console.error('--query must be specified');
      process.exit(1);
    }
  });

program.parse();