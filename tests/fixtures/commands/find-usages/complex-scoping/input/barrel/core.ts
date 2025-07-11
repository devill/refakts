// Core barrel module with shadowing

export function process(data: string): string {
  return `Processed: ${data}`;
}

const count = 10; // This variable will be shadowed

export function getCount(): number {
  return count;
}

export default class MainService {
  private count = 5; // Shadows the module-level count

  getInternalCount(): number {
    return this.count; // References the class property
  }

  getModuleCount(): number {
    return getCount(); // References the module function
  }
}