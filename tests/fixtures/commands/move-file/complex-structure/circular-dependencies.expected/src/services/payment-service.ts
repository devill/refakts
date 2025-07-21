import { User } from '../modules/user';
import { Order } from '../domain/order/order';

export class PaymentService {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async setupPayment(user: User): Promise<void> {
    console.log(`Setting up payment for user: ${user.getId()}`);
  }

  async processPayment(order: Order): Promise<boolean> {
    console.log(`Processing payment for order: ${order.getId()}`);
    return true;
  }
}