// Service class with constructor parameter properties

export class UserService {
  constructor(
    private name: string,
    private readonly baseUrl: string,
    public timeout: number = 5000
  ) {}

  async fetchData(): Promise<any> {
    const url = `${this.baseUrl}/users`;
    console.log(`Fetching from ${url} with timeout ${this.timeout}`);
    return fetch(url, { 
      signal: AbortSignal.timeout(this.timeout) 
    });
  }

  getName(): string {
    return this.name;
  }

  setName(newName: string): void {
    this.name = newName;
  }

  getTimeout(): number {
    return this.timeout;
  }
}