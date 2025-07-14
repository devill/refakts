export function formatName(name: string): string {
  return name.trim().toLowerCase();
}

export function validateString(str: string): boolean {
  return str.length > 0;
}