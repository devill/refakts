import { TestMeta } from '../types/test-case-types';

export function extractMetaFromFile(content: string): TestMeta {
  const lines = content.split('\n');
  const meta = initializeMetaData();
  
  for (const line of lines) {
    parseLine(line.trim(), meta);
  }
  
  return meta;
}

function initializeMetaData(): TestMeta {
  return { description: '', commands: [], skip: false };
}

function parseLine(trimmed: string, meta: TestMeta): void {
  if (trimmed.startsWith('* @description')) {
    meta.description = trimmed.replace('* @description', '').trim();
  } else if (trimmed.startsWith('* @command')) {
    meta.commands.push(trimmed.replace('* @command', '').trim());
  } else if (trimmed.startsWith('* @skip')) {
    meta.skip = true;
  }
}