import { ApiUser } from '../types/api';

export class User {
  constructor(
    public id: number,
    public name: string,
    public email: string
  ) {}

  toApiFormat(): ApiUser {
    return {
      id: this.id,
      name: this.name,
      email: this.email
    };
  }

  static fromApiFormat(apiUser: ApiUser): User {
    return new User(apiUser.id, apiUser.name, apiUser.email);
  }
}