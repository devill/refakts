/**
 * @description Basic class with methods out of order that need sorting by step down rule
 * @command sort-methods "[simple-class.input.ts 5:1-5:10]"
 */
export class Calculator {
  private baseValue = 10;
  private multiplier = 2;

  private multiply(a: number, b: number): number {
    return a * b;
  }

  constructor(initialValue?: number) {
    if (initialValue) {
      this.baseValue = initialValue;
    }
  }

  public calculate(x: number, y: number): number {
    return this.add(this.multiply(x, this.multiplier), y);
  }

  private add(a: number, b: number): number {
    return a + b;
  }

  public getResult(): number {
    return this.calculate(5, 3);
  }
}