export interface UserType {
  id: number;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface UserWithRole extends UserType {
  role: UserRole;
}