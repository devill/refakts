// Deeply nested utility function

export function deepUtil(value: string): string {
  return `Deep: ${value}`;
}

export function anotherDeep(x: number): number {
  return x * 2;
}

export const DEEP_CONSTANT = 'nested-value';