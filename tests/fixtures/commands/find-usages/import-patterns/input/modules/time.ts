// Time utility module for re-export testing

export function getCurrentTime(): string {
  return new Date().toISOString();
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString();
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}