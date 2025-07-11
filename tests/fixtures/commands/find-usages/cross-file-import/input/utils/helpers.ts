// Utility functions for the application

export function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export const DEFAULT_GREETING = "Hello, World!";