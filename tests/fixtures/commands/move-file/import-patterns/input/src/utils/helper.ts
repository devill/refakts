export function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}