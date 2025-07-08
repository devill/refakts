import { Node, MethodDeclaration } from 'ts-morph';

export class UsageAnalysisRequest {
  readonly method: MethodDeclaration;
  readonly importedSymbols: Set<string>;
  readonly externalUsage: Map<string, number>;
  readonly ownUsage: number;

  constructor(method: MethodDeclaration, importedSymbols: Set<string>) {
    this.method = method;
    this.importedSymbols = importedSymbols;
    this.externalUsage = new Map<string, number>();
    this.ownUsage = 0;
  }

  addOwnUsage(): void {
    (this as any).ownUsage++;
  }

  addExternalUsage(className: string): void {
    const count = this.externalUsage.get(className) || 0;
    this.externalUsage.set(className, count + 1);
  }

  getOwnUsage(): number {
    return this.ownUsage;
  }

  getExternalUsage(): Map<string, number> {
    return new Map(this.externalUsage);
  }

  hasExternalUsage(className: string): boolean {
    return this.externalUsage.has(className);
  }

  getExternalUsageCount(className: string): number {
    return this.externalUsage.get(className) || 0;
  }

  isInternalClassReference(text: string): boolean {
    if (!this.isValidClassName(text)) return false;
    if (this.isBuiltInClass(text)) return false;
    if (this.importedSymbols.has(text)) return false;
    
    return true;
  }

  private isValidClassName(text: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(text);
  }

  private isBuiltInClass(text: string): boolean {
    const builtInClasses = [
      'console', 'process', 'window', 'document', 'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
      'Promise', 'Error', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Buffer'
    ];
    
    return builtInClasses.includes(text);
  }
}