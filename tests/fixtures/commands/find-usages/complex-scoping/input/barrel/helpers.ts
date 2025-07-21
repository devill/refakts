// Barrel helpers module

export function format(text: string): string {
  return text.toUpperCase();
}

export function parse(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const HELPER_CONFIG = {
  enabled: true,
  version: '1.0.0'
};