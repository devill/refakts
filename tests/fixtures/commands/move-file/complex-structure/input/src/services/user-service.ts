import { User } from '../modules/user';
import { PaymentService } from './payment-service';
import { API_VERSION } from '../shared/constants';

export class UserService {
  private paymentService: PaymentService;
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.paymentService = new PaymentService(config);
  }

  async createUser(userData: any): Promise<User> {
    console.log(`Creating user with API version: ${API_VERSION}`);
    const user = new User(userData);
    await this.paymentService.setupPayment(user);
    return user;
  }

  getApiVersion(): string {
    return API_VERSION;
  }
}