export function validateUser(user: any): boolean {
  return !!(user.firstName && user.lastName && user.email);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}