// API type definitions

export interface ApiUser {
  id: number;
  name: string;
  email: string;
}

export type UserId = number;

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export type UserResponse = ApiResponse<ApiUser>;
export type UserListResponse = ApiResponse<ApiUser[]>;