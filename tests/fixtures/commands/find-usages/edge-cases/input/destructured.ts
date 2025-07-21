// Destructured import testing

export function original(x: number): number {
  return x * 2;
}

export function anotherFunc(y: number): number {
  return y + 1;
}

export const CONFIG = {
  timeout: 5000,
  retries: 3
};