/**
 * @description Class with recursive method calls that need proper entry point detection
 * @command sort-methods "[{{CURRENT_FILE}} 5:1-5:18]"
 */
export class MathProcessor {
  private cache = new Map<number, number>();

  private fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  constructor() {}

  public calculateFibonacci(n: number): number {
    if (this.cache.has(n)) {
      return this.cache.get(n)!;
    }
    const result = this.fibonacci(n);
    this.cache.set(n, result);
    return result;
  }
}