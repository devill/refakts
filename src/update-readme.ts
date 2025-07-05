#!/usr/bin/env node

import * as path from 'path';
import { DocumentationUpdater } from './documentation/DocumentationUpdater';

const README_PATH = path.join(__dirname, '..', 'README.md');

async function main() {
  try {
    const updater = new DocumentationUpdater();
    await updater.updateReadmeFile(README_PATH);
    process.stdout.write('✅ README.md updated with current help and quality checks\n');
  } catch (error) {
    process.stderr.write(`Error updating README.md: ${error}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}