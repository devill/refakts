// Application configuration constants

export const API_BASE_URL = 'https://api.example.com';
export const DEFAULT_TIMEOUT = 5000;
export const MAX_RETRIES = 3;

export const ENDPOINTS = {
  USERS: '/users',
  POSTS: '/posts',
  COMMENTS: '/comments'
} as const;

export const VERSION = '1.0.0';