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
    
    switch (kind) {
      case SyntaxKind.FunctionDeclaration:
        return 'function';
      case SyntaxKind.ClassDeclaration:
        return 'class';
      case SyntaxKind.InterfaceDeclaration:
        return 'interface';
      case SyntaxKind.TypeAliasDeclaration:
        return 'type';
      case SyntaxKind.EnumDeclaration:
        return 'enum';
      case SyntaxKind.VariableDeclaration:
        return 'variable';
      case SyntaxKind.MethodDeclaration:
        return 'method';
      case SyntaxKind.PropertyDeclaration:
        return 'property';
      case SyntaxKind.Parameter:
        return 'parameter';
      case SyntaxKind.Identifier:
        return this.getIdentifierType(node);
      default:
        return 'unknown';
    }
  }

  private static extractSymbolName(node: Node): string {
    // Try to get the name from different node types
    if (node.getKind() === SyntaxKind.Identifier) {
      return node.getText();
    }

    // For declarations, get the name identifier
    const nameNode = (node as any).getName?.();
    if (nameNode) {
      return nameNode;
    }

    // For nodes with identifier children
    const identifiers = node.getChildrenOfKind(SyntaxKind.Identifier);
    if (identifiers.length > 0) {
      return identifiers[0].getText();
    }

    // Fallback to full text
    return node.getText();
  }

  private static getIdentifierType(node: Node): string {
    const parent = node.getParent();
    if (!parent) return 'identifier';

    const parentKind = parent.getKind();
    switch (parentKind) {
      case SyntaxKind.FunctionDeclaration:
        return 'function';
      case SyntaxKind.ClassDeclaration:
        return 'class';
      case SyntaxKind.InterfaceDeclaration:
        return 'interface';
      case SyntaxKind.TypeAliasDeclaration:
        return 'type';
      case SyntaxKind.EnumDeclaration:
        return 'enum';
      case SyntaxKind.VariableDeclaration:
        return 'variable';
      case SyntaxKind.MethodDeclaration:
        return 'method';
      case SyntaxKind.PropertyDeclaration:
        return 'property';
      case SyntaxKind.Parameter:
        return 'parameter';
      case SyntaxKind.ImportSpecifier:
        return 'import';
      case SyntaxKind.ExportSpecifier:
        return 'export';
      default:
        return 'identifier';
    }
  }
}