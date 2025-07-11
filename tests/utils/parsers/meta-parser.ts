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
    meta.skip = parseSkipValue(trimmed);
  }
}

function parseSkipValue(line: string): boolean | string {
  const skipContent = line.replace('* @skip', '').trim();
  
  if (skipContent === '') return true;
  
  return extractQuotedContent(skipContent) || skipContent;
}

function extractQuotedContent(content: string): string | null {
  return isQuotedWith(content, '"') || isQuotedWith(content, "'") || null;
}

function isQuotedWith(content: string, quote: string): string | null {
  return content.startsWith(quote) && content.endsWith(quote) 
    ? content.slice(1, -1) 
    : null;
}