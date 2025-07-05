#!/usr/bin/env node
/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { loadQualityChecks } from './quality-tools/plugin-loader';

const execAsync = promisify(exec);
const README_PATH = path.join(__dirname, '..', 'README.md');

async function getHelpOutput(): Promise<string> {
  try {
    const { stdout } = await execAsync('ts-node src/cli.ts --help', {
      cwd: path.join(__dirname, '..')
    });
    return extractCommands(stdout);
  } catch {
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

function addCheckDescriptions(check: { name: string; getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined }, descriptions: Set<string>): void {
  const groupKeys = getValidGroupKeys(check);
  for (const groupKey of groupKeys) {
    const groupDef = check.getGroupDefinition?.(groupKey);
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

function getValidGroupKeys(check: { name: string; getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined }): string[] {
  const possibleKeys = buildPossibleKeys(check);
  return possibleKeys.filter(_key => isValidKey(check, _key));
}

function buildPossibleKeys(check: { name: string }): string[] {
  return [
    check.name,
    `${check.name}Functions`,
    `critical${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    `large${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    'changeFrequency',
    'cohesiveChange'
  ];
}

function isValidKey(check: { getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined }, _key: string): boolean {
  try {
    return Boolean(check.getGroupDefinition?.(_key));
  } catch {
    return false;
  }
}

async function updateReadme(): Promise<void> {
  validateReadmeExists();
  let content = fs.readFileSync(README_PATH, 'utf8');
  content = await updateBothSections(content);
  fs.writeFileSync(README_PATH, content);
  console.log('✅ README.md updated with current help and quality checks');
}

function validateReadmeExists(): void {
  if (!fs.existsSync(README_PATH)) {
    console.error('README.md not found');
    process.exit(1);
  }
}

async function updateBothSections(content: string): Promise<string> {
  const helpCommands = await getHelpOutput();
  const qualityChecks = getQualityChecksContent();
  
  content = updateHelpSection(content, helpCommands);
  content = updateQualitySection(content, qualityChecks);
  
  return content;
}

function updateHelpSection(content: string, helpCommands: string): string {
  return replaceSection(content, 
    '<!-- AUTO-GENERATED HELP START -->',
    '<!-- AUTO-GENERATED HELP END -->',
    `## Available Commands\n\n\`\`\`\n${helpCommands}\n\`\`\`\n`
  );
}

function updateQualitySection(content: string, qualityChecks: string): string {
  return replaceSection(content,
    '<!-- AUTO-GENERATED QUALITY-CHECKS START -->',
    '<!-- AUTO-GENERATED QUALITY-CHECKS END -->',
    `**Quality Checks Include:**\n\`\`\`\`\n${qualityChecks}\n\`\`\`\``
  );
}

function replaceSection(content: string, startMarker: string, endMarker: string, newContent: string): string {
  const markerPositions = findMarkerPositions(content, startMarker, endMarker);
  
  if (markerPositions.startIndex === -1 || markerPositions.endIndex === -1) {
    console.warn(`Markers ${startMarker}/${endMarker} not found in README.md`);
    return content;
  }
  
  return buildReplacementContent(content, markerPositions, startMarker, newContent);
}

function findMarkerPositions(content: string, startMarker: string, endMarker: string) {
  return {
    startIndex: content.indexOf(startMarker),
    endIndex: content.indexOf(endMarker)
  };
}

function buildReplacementContent(content: string, positions: { startIndex: number; endIndex: number }, startMarker: string, newContent: string): string {
  return content.substring(0, positions.startIndex) + 
         startMarker + '\n' + newContent + '\n' + 
         content.substring(positions.endIndex);
}

function extractCommands(helpOutput: string): string {
  const lines = helpOutput.split('\n');
  const commandsStartIndex = findCommandsStart(lines);
  
  if (commandsStartIndex === -1) return 'No refactoring commands available';
  
  const commands = parseCommandLines(lines, commandsStartIndex);
  return formatCommands(commands);
}

function findCommandsStart(lines: string[]): number {
  return lines.findIndex(line => line.trim() === 'Commands:');
}

function parseCommandLines(lines: string[], startIndex: number): string[] {
  const commands: string[] = [];
  const currentCommand = processLines(lines, startIndex, commands);
  
  if (currentCommand) commands.push(currentCommand);
  return commands;
}

function processLines(lines: string[], startIndex: number, commands: string[]): string {
  let currentCommand = '';
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (shouldStop(line)) break;
    currentCommand = processLine(line, currentCommand, commands);
  }
  return currentCommand;
}

function shouldStop(line: string): boolean {
  return !line || line.includes('help [command]');
}

function processLine(line: string, currentCommand: string, commands: string[]): string {
  if (line.includes('[options]')) {
    if (currentCommand) commands.push(currentCommand);
    return line;
  } else if (currentCommand && line && !line.includes('-h, --help')) {
    return currentCommand + ' ' + line;
  }
  return currentCommand;
}

function formatCommands(commands: string[]): string {
  return commands.length > 0 
    ? commands.map(cmd => '- ' + cmd).join('\n')
    : 'No refactoring commands available';
}


async function main() {
  await updateReadme();
}

if (require.main === module) {
  main().catch(console.error);
}