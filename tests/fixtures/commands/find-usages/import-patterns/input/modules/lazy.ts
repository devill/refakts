// Lazy loaded module for dynamic import testing

export function heavyTask(): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('Heavy task completed');
    }, 1000);
  });
}

export function computeHash(data: string): string {
  // Simulate expensive computation
  return btoa(data).substring(0, 10);
}

export const LAZY_CONFIG = {
  enabled: true,
  delay: 1000
};