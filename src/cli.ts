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
  .description('Inline a variable at the specified location')
  .argument('<file>', 'TypeScript file to refactor')
  .option('--line <number>', 'Line number (1-based)')
  .option('--column <number>', 'Column number (1-based)')  
  .option('--query <selector>', 'TSQuery selector to find the variable')
  .action(async (file: string, options) => {
    const engine = new RefactorEngine();
    
    if (options.query) {
      await engine.inlineVariableByQuery(file, options.query);
    } else if (options.line && options.column) {
      await engine.inlineVariableByLocation(file, parseInt(options.line), parseInt(options.column));
    } else {
      console.error('Either --query or both --line and --column must be specified');
      process.exit(1);
    }
  });

program.parse();