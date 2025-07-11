// Barrel utils module

export function transform(input: string): string {
  return input.toLowerCase();
}

export function validate(input: string): boolean {
  return input.length > 0;
}

export const BARREL_CONSTANT = 'barrel-utils';