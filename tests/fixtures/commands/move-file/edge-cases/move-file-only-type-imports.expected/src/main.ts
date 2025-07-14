import { formatName } from './utils/helper';
import { ApiService } from './services/api';
import type { UserType } from './domain/types/user';

const user: UserType = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
};

const formatted = formatName(user.name);
const api = new ApiService();

console.log('Formatted name:', formatted);
console.log('API service ready:', api.isReady());