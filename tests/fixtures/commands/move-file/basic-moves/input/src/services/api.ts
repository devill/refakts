export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

export default class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  isReady(): boolean {
    return !!this.config.baseUrl;
  }

  async get(endpoint: string): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    // Mock implementation
    return { url, method: 'GET' };
  }
}

export function createDefaultConfig(): ApiConfig {
  return {
    baseUrl: 'https://api.example.com',
    timeout: 5000
  };
}