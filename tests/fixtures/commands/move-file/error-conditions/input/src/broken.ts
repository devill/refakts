// This file has intentional syntax errors
export function brokenFunction(: string): string {
  return name..trim();
}

export class BrokenClass {
  private name string;  // Missing colon
  
  constructor(name: string) {
    this.name = name
  }  // Missing semicolon
  
  getName(): string {
    return this.name;
  }
}