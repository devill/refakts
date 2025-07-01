#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { loadQualityChecks } from './quality-tools/plugin-loader';

const execAsync = promisify(exec);

const README_PATH = path.join(__dirname, '..', 'README.md');
const HELP_START_MARKER = '<!-- AUTO-GENERATED HELP START -->';
const HELP_END_MARKER = '<!-- AUTO-GENERATED HELP END -->';
const QUALITY_START_MARKER = '<!-- AUTO-GENERATED QUALITY-CHECKS START -->';
const QUALITY_END_MARKER = '<!-- AUTO-GENERATED QUALITY-CHECKS END -->';

async function getHelpOutput(): Promise<string> {
  try {
    const { stdout } = await execAsync('ts-node src/cli.ts --help', {
      cwd: path.join(__dirname, '..')
    });
    return stdout;
  } catch (error: any) {
    return 'Error: Could not generate help output';
  }
}

function getQualityChecksContent(): string {
  const qualityChecks = loadQualityChecks();
  const descriptions = new Set<string>();
  
  for (const check of qualityChecks) {
    addCheckDescriptions(check, descriptions);
  }
  
  return formatDescriptions(descriptions);
}

function addCheckDescriptions(check: any, descriptions: Set<string>): void {
  const groupKeys = getGroupKeysForCheck(check);
  
  for (const groupKey of groupKeys) {
    addGroupDescription(check, groupKey, descriptions);
  }
}

function addGroupDescription(check: any, groupKey: string, descriptions: Set<string>): void {
  if (check.getGroupDefinition) {
    const groupDef = check.getGroupDefinition(groupKey);
    if (groupDef) {
      descriptions.add(`- **${groupDef.title}** (${groupDef.description})`);
    }
  }
}

function formatDescriptions(descriptions: Set<string>): string {
  return descriptions.size > 0 
    ? Array.from(descriptions).join('\n')
    : '- No quality checks configured';
}

function getGroupKeysForCheck(check: any): string[] {
  const possibleKeys = buildPossibleKeys(check);
  const validKeys = filterValidKeys(check, possibleKeys);
  return validKeys.length > 0 ? validKeys : [check.name];
}

function buildPossibleKeys(check: any): string[] {
  return [
    check.name,
    `${check.name}Functions`,
    `critical${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    `large${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    'changeFrequency',
    'cohesiveChange'
  ];
}

function filterValidKeys(check: any, possibleKeys: string[]): string[] {
  const validKeys: string[] = [];
  for (const key of possibleKeys) {
    if (isValidGroupKey(check, key)) {
      validKeys.push(key);
    }
  }
  return validKeys;
}

function isValidGroupKey(check: any, key: string): boolean {
  try {
    const def = check.getGroupDefinition(key);
    return Boolean(def);
  } catch (e) {
    return false;
  }
}

async function updateReadme(): Promise<void> {
  validateReadmeExists();
  let content = fs.readFileSync(README_PATH, 'utf8');
  
  content = await updateHelpSection(content);
  content = updateQualitySection(content);
  
  fs.writeFileSync(README_PATH, content);
  console.log('✅ README.md updated with current help and quality checks');
}

async function updateHelpSection(content: string): Promise<string> {
  const helpOutput = await getHelpOutput();
  const helpSection = createHelpSection(helpOutput);
  return updateContentWithSection(content, helpSection, HELP_START_MARKER, HELP_END_MARKER);
}

function updateQualitySection(content: string): string {
  const qualityContent = getQualityChecksContent();
  const qualitySection = createQualitySection(qualityContent);
  return updateContentWithSection(content, qualitySection, QUALITY_START_MARKER, QUALITY_END_MARKER);
}

function validateReadmeExists(): void {
  if (!fs.existsSync(README_PATH)) {
    console.error('README.md not found');
    process.exit(1);
  }
}

function createHelpSection(helpOutput: string): string {
  const commands = extractCommands(helpOutput);
  return `${HELP_START_MARKER}
## Available Commands

${commands}

${HELP_END_MARKER}`;
}

function createQualitySection(qualityContent: string): string {
  return `${QUALITY_START_MARKER}
**Quality Checks Include:**
${qualityContent}
${QUALITY_END_MARKER}`;
}

function extractCommands(helpOutput: string): string {
  const lines = helpOutput.split('\n');
  const commandsSection = findCommandsSection(lines);
  return formatCommandsForMarkdown(commandsSection);
}

function findCommandsSection(lines: string[]): string[] {
  const commandsStartIndex = findCommandsStartIndex(lines);
  if (commandsStartIndex === -1) return [];
  
  return extractCommandLines(lines, commandsStartIndex);
}

function findCommandsStartIndex(lines: string[]): number {
  return lines.findIndex(line => line.trim() === 'Commands:');
}

function extractCommandLines(lines: string[], startIndex: number): string[] {
  const commandLines: string[] = [];
  let currentCommand = '';
  
  currentCommand = processAllLines(lines, startIndex, currentCommand, commandLines);
  addFinalCommand(currentCommand, commandLines);
  return commandLines;
}

function processAllLines(lines: string[], startIndex: number, currentCommand: string, commandLines: string[]): string {
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (shouldStopExtraction(line)) break;
    
    currentCommand = processCommandLine(line, currentCommand, commandLines);
  }
  return currentCommand;
}

function processCommandLine(line: string, currentCommand: string, commandLines: string[]): string {
  if (isRefactoringCommand(line)) {
    return startNewCommand(currentCommand, commandLines, line);
  } else if (shouldExtendCommand(currentCommand, line)) {
    return currentCommand + ' ' + line;
  }
  return currentCommand;
}

function startNewCommand(currentCommand: string, commandLines: string[], line: string): string {
  addFinalCommand(currentCommand, commandLines);
  return line;
}

function shouldExtendCommand(currentCommand: string, line: string): boolean {
  return Boolean(currentCommand && line && !line.includes('-h, --help'));
}

function addFinalCommand(currentCommand: string, commandLines: string[]): void {
  if (currentCommand) {
    commandLines.push(currentCommand);
  }
}

function shouldStopExtraction(line: string): boolean {
  return line === '' || line.startsWith('Available refactoring commands:') || 
         line.includes('help [command]');
}

function isRefactoringCommand(line: string): boolean {
  return line.includes('[options]') && !line.includes('help [command]');
}

function formatCommandsForMarkdown(commandLines: string[]): string {
  if (commandLines.length === 0) return 'No refactoring commands available';
  return commandLines.map(line => '- ' + line.trim()).join('\n');
}

function updateContentWithSection(content: string, section: string, startMarker: string, endMarker: string): string {
  const markerPositions = findMarkerPositions(content, startMarker, endMarker);
  
  if (markerPositions.startIndex !== -1 && markerPositions.endIndex !== -1) {
    return replaceSection(content, section, markerPositions, endMarker);
  } else {
    console.warn(`Markers ${startMarker}/${endMarker} not found in README.md`);
    return content;
  }
}

function findMarkerPositions(content: string, startMarker: string, endMarker: string): {startIndex: number, endIndex: number} {
  return {
    startIndex: content.indexOf(startMarker),
    endIndex: content.indexOf(endMarker)
  };
}

function replaceSection(content: string, section: string, positions: {startIndex: number, endIndex: number}, endMarker: string): string {
  const before = content.substring(0, positions.startIndex);
  const after = content.substring(positions.endIndex + endMarker.length);
  return before + section + after;
}

async function main() {
  await updateReadme();
}

if (require.main === module) {
  main().catch(console.error);
}