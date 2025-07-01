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
    // Get all possible group definitions for this check
    const groupKeys = getGroupKeysForCheck(check);
    
    for (const groupKey of groupKeys) {
      if (check.getGroupDefinition) {
        const groupDef = check.getGroupDefinition(groupKey);
        if (groupDef) {
          descriptions.add(`- **${groupDef.title}** (${groupDef.description})`);
        }
      }
    }
  }
  
  return descriptions.size > 0 
    ? Array.from(descriptions).join('\n')
    : '- No quality checks configured';
}

function getGroupKeysForCheck(check: any): string[] {
  // For most checks, we can try the check name and common group patterns
  const possibleKeys = [
    check.name,
    `${check.name}Functions`,
    `critical${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    `large${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    'changeFrequency',
    'cohesiveChange'
  ];
  
  const validKeys: string[] = [];
  for (const key of possibleKeys) {
    try {
      const def = check.getGroupDefinition(key);
      if (def) {
        validKeys.push(key);
      }
    } catch (e) {
      // Ignore errors for invalid keys
    }
  }
  
  return validKeys.length > 0 ? validKeys : [check.name];
}

async function updateReadme(): Promise<void> {
  validateReadmeExists();
  let content = fs.readFileSync(README_PATH, 'utf8');
  
  // Update help section
  const helpOutput = await getHelpOutput();
  const helpSection = createHelpSection(helpOutput);
  content = updateContentWithSection(content, helpSection, HELP_START_MARKER, HELP_END_MARKER);
  
  // Update quality checks section
  const qualityContent = getQualityChecksContent();
  const qualitySection = createQualitySection(qualityContent);
  content = updateContentWithSection(content, qualitySection, QUALITY_START_MARKER, QUALITY_END_MARKER);
  
  fs.writeFileSync(README_PATH, content);
  console.log('✅ README.md updated with current help and quality checks');
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
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (shouldStopExtraction(line)) break;
    
    if (isRefactoringCommand(line)) {
      if (currentCommand) {
        commandLines.push(currentCommand);
      }
      currentCommand = line;
    } else if (currentCommand && line && !line.includes('-h, --help')) {
      currentCommand += ' ' + line;
    }
  }
  
  if (currentCommand) {
    commandLines.push(currentCommand);
  }
  
  return commandLines;
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
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex + endMarker.length);
    return before + section + after;
  } else {
    console.warn(`Markers ${startMarker}/${endMarker} not found in README.md`);
    return content;
  }
}

async function main() {
  await updateReadme();
}

if (require.main === module) {
  main().catch(console.error);
}