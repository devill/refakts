export class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  remove(item: T): boolean {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  size(): number {
    return this.items.length;
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  getAll(): T[] {
    return [...this.items];
  }
}

export interface ContainerOptions<T> {
  initialItems?: T[];
  maxSize?: number;
  validator?: (item: T) => boolean;
}

export function createContainer<T>(options: ContainerOptions<T> = {}): Container<T> {
  const container = new Container<T>();
  
  if (options.initialItems) {
    options.initialItems.forEach(item => container.add(item));
  }
  
  return container;
}