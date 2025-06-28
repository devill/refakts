import { Project, Node, VariableDeclaration, SyntaxKind } from 'ts-morph';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as path from 'path';

export class RefactorEngine {
  private project: Project;

  constructor() {
    this.project = new Project();
  }


  async inlineVariableByQuery(filePath: string, query: string): Promise<void> {
    const sourceFile = this.loadSourceFile(filePath);
    const node = this.findNodeByQuery(sourceFile, query);
    await this.performInlineVariable(node);
    await sourceFile.save();
  }

  private async performInlineVariable(node: Node): Promise<void> {
    this.validateIdentifierNode(node);
    const variableName = node.getText();
    const sourceFile = node.getSourceFile();
    const declaration = this.getVariableDeclaration(sourceFile, variableName);
    const initializerText = this.getInitializerText(declaration, variableName);
    this.replaceAllReferences(sourceFile, variableName, declaration, initializerText);
    this.removeDeclaration(declaration);
  }
  
  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
  }

  private findNodeByQuery(sourceFile: any, query: string): Node {
    const matches = this.executeQuery(sourceFile, query);
    this.validateMatches(matches, query);
    
    // If multiple matches, they should all be identifiers referring to the same variable
    if (matches.length > 1) {
      const firstNode = this.convertToMorphNode(sourceFile, matches[0]);
      if (Node.isIdentifier(firstNode)) {
        const variableName = firstNode.getText();
        // Verify all matches refer to the same variable
        for (let i = 1; i < matches.length; i++) {
          const node = this.convertToMorphNode(sourceFile, matches[i]);
          if (!Node.isIdentifier(node) || node.getText() !== variableName) {
            throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
          }
        }
        // All matches are the same variable, use the first one
        return firstNode;
      } else {
        throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
      }
    }
    
    return this.convertToMorphNode(sourceFile, matches[0]);
  }

  private validateIdentifierNode(node: Node): void {
    if (node.getKind() !== 80) {
      throw new Error(`Expected identifier, got ${node.getKindName()}`);
    }
  }

  private getVariableDeclaration(sourceFile: any, variableName: string): VariableDeclaration {
    const declaration = this.findVariableDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Variable declaration for '${variableName}' not found`);
    }
    return declaration;
  }

  private getInitializerText(declaration: VariableDeclaration, variableName?: string, context?: Node): string {
    const nameNode = declaration.getNameNode();
    
    // Handle destructuring patterns
    if (Node.isObjectBindingPattern(nameNode) && variableName) {
      const initializer = declaration.getInitializer();
      if (!initializer) {
        throw new Error('Destructuring declaration has no initializer to inline');
      }
      
      // For destructuring { x } = point, the initializer for x is point.x
      const initializerText = initializer.getText();
      return `${initializerText}.${variableName}`;
    }
    
    // Handle regular variable declarations
    const initializer = declaration.getInitializer();
    if (!initializer) {
      throw new Error('Variable has no initializer to inline');
    }
    
    // For complex expressions, wrap in parentheses to preserve precedence
    const initializerText = initializer.getText();
    if (this.needsParentheses(initializer, context)) {
      return `(${initializerText})`;
    }
    return initializerText;
  }

  private needsParentheses(node: Node, context?: Node): boolean {
    // Only add parentheses for simple binary expressions with + or -
    // when they might be used in multiplication contexts
    if (Node.isBinaryExpression(node)) {
      const operator = node.getOperatorToken().getKind();
      // Only wrap simple addition/subtraction expressions (x + y, not complex expressions)
      if (operator === SyntaxKind.PlusToken || operator === SyntaxKind.MinusToken) {
        // Check if both operands are simple (identifiers or literals)
        const left = node.getLeft();
        const right = node.getRight();
        return (Node.isIdentifier(left) || Node.isNumericLiteral(left)) &&
               (Node.isIdentifier(right) || Node.isNumericLiteral(right));
      }
    }
    return false;
  }

  private replaceAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration, initializerText: string): void {
    const references = this.findAllReferences(sourceFile, variableName, declaration);
    for (const reference of references) {
      reference.replaceWithText(initializerText);
    }
  }

  private removeDeclaration(declaration: VariableDeclaration): void {
    const declarationStatement = declaration.getVariableStatement();
    if (declarationStatement) {
      declarationStatement.remove();
    }
  }

  private isMatchingIdentifier(node: Node, variableName: string, declarationNode: Node): boolean {
    return node.getKind() === 80 && 
           node.getText() === variableName && 
           node !== declarationNode &&
           !this.isInTypeContext(node) &&
           !this.isInDestructuringPattern(node);
  }

  private isInDestructuringPattern(node: Node): boolean {
    // Check if this identifier is part of a destructuring pattern like { x } = point
    let parent = node.getParent();
    while (parent) {
      if (parent.getKind() === SyntaxKind.ObjectBindingPattern ||
          parent.getKind() === SyntaxKind.ArrayBindingPattern ||
          parent.getKind() === SyntaxKind.BindingElement) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }

  private isInTypeContext(node: Node): boolean {
    // Check if this identifier is part of a type annotation
    let parent = node.getParent();
    while (parent) {
      // Check for type literal context (like { x: number; y: number })
      if (parent.getKind() === SyntaxKind.TypeLiteral ||
          parent.getKind() === SyntaxKind.PropertySignature ||
          parent.getKind() === SyntaxKind.TypeReference) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }

  private executeQuery(sourceFile: any, query: string) {
    return tsquery(sourceFile.compilerNode, query);
  }

  private validateMatches(matches: any[], query: string): void {
    if (matches.length === 0) {
      throw new Error(`No matches found for query: ${query}`);
    }
  }

  private convertToMorphNode(sourceFile: any, match: any): Node {
    const node = sourceFile.getDescendantAtPos(match.getStart());
    if (!node) {
      throw new Error(`Could not find ts-morph node for query match`);
    }
    return node;
  }

  private collectMatchingIdentifiers(sourceFile: any, variableName: string, declarationNode: Node, references: Node[]): void {
    sourceFile.forEachDescendant((node: Node) => {
      if (this.isMatchingIdentifier(node, variableName, declarationNode)) {
        references.push(node);
      }
    });
  }

  private findVariableDeclaration(sourceFile: any, variableName: string): VariableDeclaration | undefined {
    const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    
    for (const decl of variableDeclarations) {
      // Check regular variable declarations
      if (decl.getName() === variableName) {
        return decl;
      }
      
      // Check destructuring patterns
      const nameNode = decl.getNameNode();
      if (Node.isObjectBindingPattern(nameNode)) {
        for (const element of nameNode.getElements()) {
          if (element.getName() === variableName) {
            // For destructuring, we need to return the declaration that contains the pattern
            return decl;
          }
        }
      }
    }
    return undefined;
  }

  private findAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration): Node[] {
    const references: Node[] = [];
    const declarationNode = declaration.getNameNode();
    this.collectMatchingIdentifiers(sourceFile, variableName, declarationNode, references);
    return references;
  }

}