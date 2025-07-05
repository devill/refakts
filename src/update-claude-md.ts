#!/usr/bin/env node

import * as path from 'path';
import { DocumentationUpdater } from './documentation/DocumentationUpdater';

const CLAUDE_MD_PATH = path.join(__dirname, '..', 'CLAUDE.md');

async function main() {
  try {
    const updater = new DocumentationUpdater();
    await updater.updateClaudeFile(CLAUDE_MD_PATH);
    process.stdout.write('✅ CLAUDE.md updated with current --help output\n');
  } catch (error) {
    process.stderr.write(`Error updating CLAUDE.md: ${error}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}