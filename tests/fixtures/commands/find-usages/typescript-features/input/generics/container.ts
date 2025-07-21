// Generic container class for TypeScript features testing

export class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  getAll(): T[] {
    return [...this.items];
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  map<U>(mapper: (item: T) => U): U[] {
    return this.items.map(mapper);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  static create<T>(): Container<T> {
    return new Container<T>();
  }
}