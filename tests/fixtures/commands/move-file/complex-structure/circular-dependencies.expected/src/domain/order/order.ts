import { User } from '../../modules/user';
import { UserService } from '../../services/user-service';
import { PaymentService } from '../../services/payment-service';

export class Order {
  private id: number;
  private user: User;
  private userService: UserService;
  private paymentService: PaymentService;

  constructor(id: number, userService: UserService) {
    this.id = id;
    this.userService = userService;
    this.paymentService = new PaymentService({});
    this.user = new User({ id: 'user123', name: 'John Doe' });
  }

  getId(): number {
    return this.id;
  }

  getUser(): User {
    return this.user;
  }

  async processPayment(): Promise<boolean> {
    return await this.paymentService.processPayment(this);
  }
}