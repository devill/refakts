/**
 * @description Basic class with methods out of order that need sorting by step down rule
 * @command sort-methods "[{{CURRENT_FILE}} 5:1-5:10]"
 */
export class Calculator {
  private baseValue = 10;
  private multiplier = 2;

  constructor(initialValue?: number) {
    if (initialValue) {
      this.baseValue = initialValue;
    }
  }

  public getResult(): number {
    return this.calculate(5, 3);
  }

  public calculate(x: number, y: number): number {
    return this.add(this.multiply(x, this.multiplier), y);
  }

  private add(a: number, b: number): number {
    return a + b;
  }

  private multiply(a: number, b: number): number {
    return a * b;
  }
}