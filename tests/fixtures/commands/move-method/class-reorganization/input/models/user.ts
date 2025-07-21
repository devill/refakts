export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  birthYear: number;
}

export class User {
  constructor(private data: UserData) {}
  
  getEmail(): string {
    return this.data.email;
  }
  
  getBirthYear(): number {
    return this.data.birthYear;
  }
  
  getFirstName(): string {
    return this.data.firstName;
  }
  
  getLastName(): string {
    return this.data.lastName;
  }
}