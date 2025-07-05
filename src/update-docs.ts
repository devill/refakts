#!/usr/bin/env node

import * as path from 'path';
import { DocumentationUpdater } from './documentation/DocumentationUpdater';

const CLAUDE_MD_PATH = path.join(__dirname, '..', 'CLAUDE.md');
const README_PATH = path.join(__dirname, '..', 'README.md');

async function updateClaudeDocumentation(updater: DocumentationUpdater): Promise<void> {
  process.stdout.write('Updating CLAUDE.md...\n');
  await updater.updateClaudeFile(CLAUDE_MD_PATH);
  process.stdout.write('✅ CLAUDE.md updated with current --help output\n');
}

async function updateReadmeDocumentation(updater: DocumentationUpdater): Promise<void> {
  process.stdout.write('Updating README.md...\n');
  await updater.updateReadmeFile(README_PATH);
  process.stdout.write('✅ README.md updated with current help and quality checks\n');
}

async function main() {
  try {
    const updater = new DocumentationUpdater();
    await updateClaudeDocumentation(updater);
    await updateReadmeDocumentation(updater);
  } catch (error) {
    process.stderr.write(`Error updating documentation: ${error}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}