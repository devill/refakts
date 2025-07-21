// Module A in circular dependency

export function functionA(): string {
  return 'From module A';
}

export function callModuleB(): string {
  // Import here to avoid circular import issues
  const { functionB } = require('../circular-b/module-b');
  return `A calls B: ${functionB()}`;
}

export const MODULE_A_CONSTANT = 'module-a-value';