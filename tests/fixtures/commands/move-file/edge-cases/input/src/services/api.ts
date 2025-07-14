export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.example.com';
  }

  isReady(): boolean {
    return !!this.baseUrl;
  }

  async get(endpoint: string): Promise<any> {
    return fetch(`${this.baseUrl}${endpoint}`);
  }
}