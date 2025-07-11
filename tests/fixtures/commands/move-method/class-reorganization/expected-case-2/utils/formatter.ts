export class Formatter {
  static formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  static formatDate(date: Date): string {
    return date.toLocaleDateString();
  }
}