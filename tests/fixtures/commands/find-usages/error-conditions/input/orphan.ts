// Orphan TypeScript file without tsconfig.json

export function orphanFunc(): void {
  console.log('This function has no project context');
}

export const ORPHAN_CONSTANT = 'no-project';

import { testFunc } from './valid';

// This might not resolve properly without tsconfig.json
const result = testFunc();