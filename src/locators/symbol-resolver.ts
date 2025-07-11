import { Node, SyntaxKind } from 'ts-morph';

export class SymbolResolver {
  static getSymbolName(node: Node): string {
    return this.extractSymbolName(node);
  }

  static isValidSymbol(node: Node): boolean {
    return this.getSymbolType(node) !== 'unknown';
  }

  static getSymbolType(node: Node): string {
    const kind = node.getKind();
    return this.mapKindToType(kind, node);
  }

  private static mapKindToType(kind: SyntaxKind, node: Node): string {
    const typeMap = new Map([
      [SyntaxKind.FunctionDeclaration, 'function'],
      [SyntaxKind.ClassDeclaration, 'class'],
      [SyntaxKind.InterfaceDeclaration, 'interface'],
      [SyntaxKind.TypeAliasDeclaration, 'type'],
      [SyntaxKind.EnumDeclaration, 'enum'],
      [SyntaxKind.VariableDeclaration, 'variable'],
      [SyntaxKind.MethodDeclaration, 'method'],
      [SyntaxKind.PropertyDeclaration, 'property'],
      [SyntaxKind.Parameter, 'parameter']
    ]);

    return typeMap.get(kind) || 
           (kind === SyntaxKind.Identifier ? this.getIdentifierType(node) : 'unknown');
  }

  private static extractSymbolName(node: Node): string {
    if (node.getKind() === SyntaxKind.Identifier) {
      return node.getText();
    }

    const nameNode = (node as unknown as { getName?: () => string }).getName?.();
    if (nameNode) {
      return nameNode;
    }

    const identifiers = node.getChildrenOfKind(SyntaxKind.Identifier);
    if (identifiers.length > 0) {
      return identifiers[0].getText();
    }

    return node.getText();
  }

  private static getIdentifierType(node: Node): string {
    const parent = node.getParent();
    if (!parent) return 'identifier';

    return this.mapParentKindToType(parent.getKind());
  }

  private static mapParentKindToType(parentKind: SyntaxKind): string {
    const parentTypeMap = new Map([
      [SyntaxKind.FunctionDeclaration, 'function'],
      [SyntaxKind.ClassDeclaration, 'class'],
      [SyntaxKind.InterfaceDeclaration, 'interface'],
      [SyntaxKind.TypeAliasDeclaration, 'type'],
      [SyntaxKind.EnumDeclaration, 'enum'],
      [SyntaxKind.VariableDeclaration, 'variable'],
      [SyntaxKind.MethodDeclaration, 'method'],
      [SyntaxKind.PropertyDeclaration, 'property'],
      [SyntaxKind.Parameter, 'parameter'],
      [SyntaxKind.ImportSpecifier, 'import'],
      [SyntaxKind.ExportSpecifier, 'export']
    ]);

    return parentTypeMap.get(parentKind) || 'identifier';
  }
}