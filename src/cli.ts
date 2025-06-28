#!/usr/bin/env node

import { Command } from 'commander';
import { RefactorEngine } from './refactor-engine';
import { generateHelpText, getFixtureFolders, getCompletionStatus } from './cli-generator';

const program = new Command();

program
  .name('refakts')
  .description('TypeScript refactoring tool based on ts-morph')
  .version('1.0.0');

// Add custom help text
program.addHelpText('after', '\n' + generateHelpText());

// Dynamically add commands based on fixture folders
const fixtureFolders = getFixtureFolders();
const completionStatus = getCompletionStatus();

for (const folder of fixtureFolders) {
  const status = completionStatus[folder];
  const description = status?.description || 'No description available';
  const warningText = status?.complete === false ? ' (warning: incomplete)' : '';
  
  program
    .command(folder)
    .description(description + warningText)
    .argument('<file>', 'TypeScript file to refactor')
    .option('--query <selector>', 'TSQuery selector to find the target')
    .action(async (file: string, options) => {
      if (!options.query) {
        console.error('--query must be specified');
        process.exit(1);
      }
      
      const engine = new RefactorEngine();
      
      // Route to appropriate method based on command
      switch (folder) {
        case 'inline-variable':
          await engine.inlineVariableByQuery(file, options.query);
          break;
        default:
          if (status?.complete === false) {
            console.error(`Command '${folder}' is not yet implemented (marked as incomplete)`);
            process.exit(1);
          } else {
            console.error(`Command '${folder}' not implemented`);
            process.exit(1);
          }
      }
    });
}

program.parse();