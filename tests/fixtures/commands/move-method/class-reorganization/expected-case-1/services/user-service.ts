import { User, UserData } from '../models/user';

export class UserService {
  private users: User[] = [];
  
  addUser(userData: UserData): User {
    const user = new User(userData);
    this.users.push(user);
    return user;
  }
  
  getFormattedUserName(user: User): string {
    return user.formatDisplayName();
  }
  
  getAllUsers(): User[] {
    return [...this.users];
  }
}