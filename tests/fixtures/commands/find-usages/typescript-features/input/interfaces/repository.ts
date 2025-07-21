// Repository interface and implementation

export interface Repository<T> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  delete(id: string): Promise<boolean>;
}

export class UserRepository implements Repository<User> {
  async save(user: User): Promise<User> {
    // Implementation
    return user;
  }

  async findById(id: string): Promise<User | null> {
    // Implementation
    return null;
  }

  async findAll(): Promise<User[]> {
    // Implementation
    return [];
  }

  async delete(id: string): Promise<boolean> {
    // Implementation
    return true;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export class DatabaseService {
  private userRepo = new UserRepository();

  async getUser(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  async saveUser(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepo.delete(id);
  }
}