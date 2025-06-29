#!/usr/bin/env node

import { Command } from 'commander';
import { RefactorEngine } from './refactor-engine';
import { generateHelpText, getFixtureFolders, getCompletionStatus } from './cli-generator';

const program = new Command();

program
  .name('refakts')
  .description('TypeScript refactoring tool based on ts-morph')
  .version('1.0.0');

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
    .option('--query <selector>', 'Target identifier or expression to refactor')
    .option('--to <newName>', 'New name for rename operations')
    .addHelpText('after', getDetailedHelp(folder, status))
    .action(async (file: string, options) => {
      if (!options.query) {
        console.error('--query must be specified');
        process.exit(1);
      }
      
      const engine = new RefactorEngine();
      
      switch (folder) {
        case 'inline-variable':
          await engine.inlineVariableByQuery(file, options.query);
          break;
        case 'rename':
          if (!options.to) {
            console.error('--to must be specified for rename operations');
            process.exit(1);
          }
          await engine.renameByQuery(file, options.query, options.to);
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

function getDetailedHelp(command: string, status: any): string {
  switch (command) {
    case 'inline-variable':
      return '\nExamples:\n  refakts inline-variable src/file.ts --query "Identifier[name=\'myVar\']"\n  refakts inline-variable src/file.ts --query "VariableDeclaration"';
    case 'node-finding':
      return '\nExamples:\n  refakts node-finding src/file.ts --query "FunctionDeclaration"\n  (Currently incomplete - implementation in progress)';
    default:
      return '';
  }
}

program.parse();