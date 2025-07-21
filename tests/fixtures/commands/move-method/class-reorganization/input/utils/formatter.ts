import { User } from '../models/user';

export class Formatter {
  static formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  static formatUserDisplayName(user: User): string {
    const firstName = user.getFirstName();
    const lastName = user.getLastName();
    return `${firstName} ${lastName}`;
  }

  static formatDate(date: Date): string {
    return date.toLocaleDateString();
  }
}