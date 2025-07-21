import { loadEnv } from './env-loader.js';

export interface AppConfig {
  apiUrl: string;
  timeout: number;
  isValid: boolean;
}

export function loadConfig(): AppConfig {
  const env = loadEnv();
  
  return {
    apiUrl: env.API_URL || 'http://localhost:3000',
    timeout: parseInt(env.TIMEOUT || '5000'),
    isValid: true
  };
}

export function validateConfig(config: AppConfig): boolean {
  return !!(config.apiUrl && config.timeout > 0);
}