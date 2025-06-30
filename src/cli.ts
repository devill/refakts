#!/usr/bin/env node

import { Command } from 'commander';
import { RefactorEngine } from './refactor-engine';
import { generateHelpText, getFixtureFolders, getCompletionStatus } from './cli-generator';
import { VariableLocator } from './locators/variable-locator';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as yaml from 'js-yaml';

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

// Add locator commands
program
  .command('variable-locator')
  .description('Find variable declarations and all their usages')
  .argument('<file>', 'TypeScript file to analyze')
  .option('--query <selector>', 'TSQuery selector to find the target variable')
  .addHelpText('after', '\nExamples:\n  refakts variable-locator src/file.ts --query "Identifier[name=\'myVar\']"\n  refakts variable-locator src/file.ts --query "Parameter Identifier[name=\'param\']"')
  .action(async (file: string, options) => {
    if (!options.query) {
      console.error('--query must be specified');
      process.exit(1);
    }
    
    try {
      const locator = new VariableLocator();
      const sourceFileContent = require('fs').readFileSync(file, 'utf8');
      const ast = tsquery.ast(sourceFileContent);
      const matches = tsquery(ast, options.query);
      
      if (matches.length === 0) {
        console.error('No matches found for query');
        process.exit(1);
      }
      
      // Extract variable name from the first match
      const targetNode = matches[0];
      let variableName: string;
      
      if (targetNode.kind === 75) { // SyntaxKind.Identifier
        variableName = (targetNode as any).text;
      } else {
        // Try to find identifier in the matched node
        const identifiers = tsquery(targetNode, 'Identifier');
        if (identifiers.length === 0) {
          console.error('Could not extract variable name from query result');
          process.exit(1);
        }
        variableName = (identifiers[0] as any).text;
      }
      
      const result = await locator.findVariableReferences(file, variableName);
      console.log(yaml.dump(result, { indent: 2 }));
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();