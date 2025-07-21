import { Container } from './generics/container';
import { UserService } from './generics/service';
import { Repository, UserRepository, User, DatabaseService } from './interfaces/repository';

// Using generic container
const stringContainer = new Container<string>();
const numberContainer = Container.create<number>();

// Using container methods
stringContainer.add('hello');
stringContainer.add('world');
const firstString = stringContainer.get(0);
const allStrings = stringContainer.getAll();

// Using generic type parameter in different contexts
const foundString = stringContainer.find(item => item.length > 3);
const lengths = stringContainer.map(item => item.length);
const longStrings = stringContainer.filter(item => item.length > 4);

// Using service with constructor properties
const userService = new UserService('api', 'https://api.example.com', 3000);
const serviceName = userService.getName();
const serviceTimeout = userService.getTimeout();

// Using interface method implementations
const userRepo: Repository<User> = new UserRepository();
const dbService = new DatabaseService();

// Using interface methods
userRepo.save({ id: '1', name: 'John', email: 'john@example.com' });
userRepo.findById('1');
userRepo.findAll();
userRepo.delete('1');

// Using methods through database service
dbService.getUser('1');
dbService.saveUser({ id: '2', name: 'Jane', email: 'jane@example.com' });
dbService.deleteUser('2');