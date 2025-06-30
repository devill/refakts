#!/usr/bin/env node

import { Command } from 'commander';
import { generateHelpText, getFixtureFolders, getCompletionStatus } from './cli-generator';
import { VariableLocator } from './locators/variable-locator';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as yaml from 'js-yaml';
import { CommandRegistry } from './commands/command-registry';

const program = new Command();

program
  .name('refakts')
  .description('TypeScript refactoring tool based on ts-morph')
  .version('1.0.0');

const fixtureFolders = getFixtureFolders();
const completionStatus = getCompletionStatus();
const commandRegistry = new CommandRegistry();

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
      await executeRefactoringCommand(folder, file, options, status);
    });
}

async function executeRefactoringCommand(commandName: string, file: string, options: any, status: any): Promise<void> {
  const command = commandRegistry.get(commandName);
  
  if (command) {
    await executeRegisteredCommand(command, file, options);
  } else {
    handleUnregisteredCommand(commandName, status);
  }
}

async function executeRegisteredCommand(command: any, file: string, options: any): Promise<void> {
  try {
    command.validateOptions(options);
    await command.execute(file, options);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

function handleUnregisteredCommand(commandName: string, status: any): void {
  if (status?.complete === false) {
    console.error(`Command '${commandName}' is not yet implemented (marked as incomplete)`);
  } else {
    console.error(`Command '${commandName}' not implemented`);
  }
  process.exit(1);
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

addVariableLocatorCommand();

function addVariableLocatorCommand() {
  const command = createVariableLocatorCommand();
  command.action(handleVariableLocatorAction);
}

function createVariableLocatorCommand() {
  return program
    .command('variable-locator')
    .description('Find variable declarations and all their usages')
    .argument('<file>', 'TypeScript file to analyze')
    .option('--query <selector>', 'TSQuery selector to find the target variable')
    .option('--line <number>', 'Line number to target variable declaration')
    .option('--column <number>', 'Column number to target variable declaration')
    .addHelpText('after', getVariableLocatorHelpText());
}

function getVariableLocatorHelpText(): string {
  return '\nExamples:\n  refakts variable-locator src/file.ts --query "Identifier[name=\'myVar\']"\n  refakts variable-locator src/file.ts --line 10 --column 5\n  refakts variable-locator src/file.ts --query "Parameter Identifier[name=\'param\']"';
}

async function handleVariableLocatorAction(file: string, options: any) {
  validateVariableLocatorOptions(options);
  
  try {
    const locator = new VariableLocator();
    const result = await executeVariableLocatorCommand(file, options, locator);
    console.log(yaml.dump(result, { indent: 2 }));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function validateVariableLocatorOptions(options: any) {
  if (!options.query && (!options.line || !options.column)) {
    console.error('Either --query or both --line and --column must be specified');
    process.exit(1);
  }
}

async function executeVariableLocatorCommand(file: string, options: any, locator: VariableLocator) {
  if (options.line && options.column) {
    return await locator.findVariableByPosition(file, parseInt(options.line), parseInt(options.column));
  } else {
    const variableName = extractVariableNameFromQuery(file, options.query);
    return await locator.findVariableReferences(file, variableName);
  }
}

function extractVariableNameFromQuery(file: string, query: string): string {
  const matches = executeQuery(file, query);
  const targetNode = getFirstMatch(matches);
  return extractNameFromNode(targetNode);
}

function executeQuery(file: string, query: string) {
  const sourceFileContent = require('fs').readFileSync(file, 'utf8');
  const ast = tsquery.ast(sourceFileContent);
  return tsquery(ast, query);
}

function getFirstMatch(matches: any[]) {
  if (matches.length === 0) {
    console.error('No matches found for query');
    process.exit(1);
  }
  return matches[0];
}

function extractNameFromNode(targetNode: any): string {
  if (targetNode.kind === 75) {
    return (targetNode as any).text;
  } else {
    return findIdentifierInNode(targetNode);
  }
}

function findIdentifierInNode(targetNode: any): string {
  const identifiers = tsquery(targetNode, 'Identifier');
  if (identifiers.length === 0) {
    console.error('Could not extract variable name from query result');
    process.exit(1);
  }
  return (identifiers[0] as any).text;
}

program.parse();