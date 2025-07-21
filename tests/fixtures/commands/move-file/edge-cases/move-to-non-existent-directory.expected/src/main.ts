import { formatName } from './utils/helper';
import { ApiService } from './new/nested/path/api';
import type { UserType } from './types/user';

const user: UserType = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
};

const formatted = formatName(user.name);
const api = new ApiService();

console.log('Formatted name:', formatted);
console.log('API service ready:', api.isReady());