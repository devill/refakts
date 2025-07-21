/**
 * @description Test boundary selection on class method
 * @command refakts select class-method.input.ts --regex "calculateTax" --boundaries "function"
 * @skip
 */

class Calculator {
  private rate: number = 0.1;
  
  calculateTax(amount: number) {
    return amount * this.rate;
  }
  
  getTotal(price: number) {
    return price + this.calculateTax(price);
  }
}