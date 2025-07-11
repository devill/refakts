import { add, multiply } from './utils/math';
import { User } from './models/user';
import { ApiUser, UserId, UserResponse } from './types/api';
import { Status, Priority } from './enums/status';
import { API_BASE_URL, DEFAULT_TIMEOUT } from './constants/config';

// Using functions
const sum = add(5, 3);
const product = multiply(4, 6);

// Using classes
const user = new User(1, 'John Doe', 'john@example.com');
const anotherUser = User.fromApiFormat({
  id: 2,
  name: 'Jane Smith',
  email: 'jane@example.com'
});

// Using interfaces and types
const apiUser: ApiUser = user.toApiFormat();
const userId: UserId = user.id;

// Using enums
const userStatus = Status.ACTIVE;
const taskPriority = Priority.HIGH;

// Using constants
const baseUrl = API_BASE_URL;
const timeout = DEFAULT_TIMEOUT;

// Complex usage in functions
function processUserData(userData: ApiUser): UserResponse {
  const user = User.fromApiFormat(userData);
  return {
    data: user.toApiFormat(),
    status: 'success'
  };
}

// Using add function in multiple places
const calculation1 = add(10, 20);
const calculation2 = add(sum, product);
const calculation3 = add(userId, 100);