import { UserService } from '../services/user-service';

export class User {
  private id: string;
  private name: string;
  private service?: UserService;

  constructor(userData: any) {
    this.id = userData.id;
    this.name = userData.name;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  setService(service: UserService): void {
    this.service = service;
  }

  getApiVersion(): string {
    return this.service?.getApiVersion() || 'unknown';
  }
}