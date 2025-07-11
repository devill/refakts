import { User, UserData } from '../models/user';
import { Formatter } from '../utils/formatter';

export class UserService {
  private users: User[] = [];
  
  addUser(userData: UserData): User {
    const user = new User(userData);
    this.users.push(user);
    return user;
  }
  
  getFormattedUserName(user: User): string {
    return Formatter.formatUserDisplayName(user);
  }
  
  getAllUsers(): User[] {
    return [...this.users];
  }
}