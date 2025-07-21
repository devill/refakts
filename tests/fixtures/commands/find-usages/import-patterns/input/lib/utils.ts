// Utility functions for import patterns testing

export function format(text: string): string {
  return text.toUpperCase();
}

export function validate(input: string): boolean {
  return input.length > 0;
}

// Re-export from another module
export { getCurrentTime } from '../modules/time';

export const CONSTANTS = {
  MAX_LENGTH: 100,
  DEFAULT_VALUE: 'default'
};