/**
 * @description Basic class with methods out of order that need sorting by step down rule
 * @command sort-methods "tests/fixtures/refactoring/sort-methods/simple-class.input.ts"
 */
export class Calculator {
  private baseValue = 10;
  private multiplier = 2;

  constructor(initialValue?: number) {
    if (initialValue) {
      this.baseValue = initialValue;
    }
  }

  public calculate(x: number, y: number): number {
    return this.add(this.multiply(x, this.multiplier), y);
  }

  public getResult(): number {
    return this.calculate(5, 3);
  }

  private add(a: number, b: number): number {
    return a + b;
  }

  private multiply(a: number, b: number): number {
    return a * b;
  }
}