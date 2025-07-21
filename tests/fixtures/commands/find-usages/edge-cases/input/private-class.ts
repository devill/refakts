// Private class member testing

export class PrivateClass {
  private secret: string = 'hidden';
  private readonly id: number = 42;

  constructor() {
    console.log(this.secret); // Private member usage
  }

  private getSecret(): string {
    return this.secret; // Private member usage
  }

  public publicMethod(): void {
    const value = this.getSecret(); // Private method usage
    console.log(`Secret: ${this.secret}`); // Private field usage
  }

  private updateSecret(newSecret: string): void {
    this.secret = newSecret; // Private member update
  }
}

// External usage attempts (should not be found)
const instance = new PrivateClass();
// instance.secret; // This would be a TypeScript error
// instance.getSecret(); // This would be a TypeScript error