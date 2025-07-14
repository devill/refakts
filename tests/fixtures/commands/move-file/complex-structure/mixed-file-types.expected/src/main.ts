import { UserService } from './services/user-service';
import { Order } from './modules/order';
import { loadConfig } from './configuration/config';
import { API_VERSION } from './shared/constants';

const config = loadConfig();
const userService = new UserService(config);
const order = new Order(123, userService);

console.log(`API Version: ${API_VERSION}`);
console.log(`Order ID: ${order.getId()}`);
console.log(`Config loaded: ${config.isValid}`);