import { MethodDeclaration } from 'ts-morph';

export class UsageAnalysisRequest {
  readonly method: MethodDeclaration;
  readonly importedSymbols: Set<string>;
  readonly externalUsage: Map<string, number>;
  private _ownUsage = 0;

  constructor(method: MethodDeclaration, importedSymbols: Set<string>) {
    this.method = method;
    this.importedSymbols = importedSymbols;
    this.externalUsage = new Map<string, number>();
  }

  addOwnUsage(): void {
    this._ownUsage++;
  }

  addExternalUsage(className: string): void {
    const count = this.externalUsage.get(className) || 0;
    this.externalUsage.set(className, count + 1);
  }

  getOwnUsage(): number {
    return this._ownUsage;
  }

  getExternalUsage(): Map<string, number> {
    return new Map(this.externalUsage);
  }
}