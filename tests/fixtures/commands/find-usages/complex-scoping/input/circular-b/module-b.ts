// Module B in circular dependency

export function functionB(): string {
  return 'From module B';
}

export function callModuleA(): string {
  // Import here to avoid circular import issues
  const { functionA } = require('../circular-a/module-a');
  return `B calls A: ${functionA()}`;
}

export const MODULE_B_CONSTANT = 'module-b-value';