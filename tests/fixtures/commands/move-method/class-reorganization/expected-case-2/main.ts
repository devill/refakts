import { UserService } from './services/user-service';

const userService = new UserService();

const user = userService.addUser({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  birthYear: 1990
});

console.log("User display name:", userService.getFormattedUserName(user));
console.log("Direct formatting:", userService.formatUserDisplayName(user));