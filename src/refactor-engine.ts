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
    
    if (matches.length > 1) {
      return this.handleMultipleMatches(sourceFile, matches, query);
    }
    
    return this.convertToMorphNode(sourceFile, matches[0]);
  }

  private handleMultipleMatches(sourceFile: any, matches: any[], query: string): Node {
    const firstNode = this.convertToMorphNode(sourceFile, matches[0]);
    if (!Node.isIdentifier(firstNode)) {
      throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
    }
    
    this.validateSameVariable(sourceFile, matches, firstNode.getText(), query);
    return firstNode;
  }

  private validateSameVariable(sourceFile: any, matches: any[], variableName: string, query: string): void {
    for (let i = 1; i < matches.length; i++) {
      const node = this.convertToMorphNode(sourceFile, matches[i]);
      if (!Node.isIdentifier(node) || node.getText() !== variableName) {
        throw new Error(`Multiple matches found for query: ${query}. Please be more specific.`);
      }
    }
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
    
    if (Node.isObjectBindingPattern(nameNode) && variableName) {
      return this.getDestructuringInitializer(declaration, variableName);
    }
    
    return this.getRegularInitializer(declaration, context);
  }

  private getDestructuringInitializer(declaration: VariableDeclaration, variableName: string): string {
    const initializer = declaration.getInitializer();
    if (!initializer) {
      throw new Error('Destructuring declaration has no initializer to inline');
    }
    
    const initializerText = initializer.getText();
    return `${initializerText}.${variableName}`;
  }

  private getRegularInitializer(declaration: VariableDeclaration, context?: Node): string {
    const initializer = declaration.getInitializer();
    if (!initializer) {
      throw new Error('Variable has no initializer to inline');
    }
    
    return this.formatInitializerText(initializer, context);
  }

  private formatInitializerText(initializer: Node, context?: Node): string {
    const initializerText = initializer.getText();
    if (this.needsParentheses(initializer, context)) {
      return `(${initializerText})`;
    }
    return initializerText;
  }

  private needsParentheses(node: Node, context?: Node): boolean {
    if (!Node.isBinaryExpression(node)) {
      return false;
    }
    
    return this.isSimpleAdditionOrSubtraction(node);
  }

  private isSimpleAdditionOrSubtraction(node: Node): boolean {
    const binaryExpr = node.asKindOrThrow(SyntaxKind.BinaryExpression);
    
    if (!this.isAdditionOrSubtraction(binaryExpr)) {
      return false;
    }
    
    return this.hasSimpleOperands(binaryExpr);
  }

  private isAdditionOrSubtraction(binaryExpr: any): boolean {
    const operator = binaryExpr.getOperatorToken().getKind();
    return operator === SyntaxKind.PlusToken || operator === SyntaxKind.MinusToken;
  }

  private hasSimpleOperands(binaryExpr: any): boolean {
    const left = binaryExpr.getLeft();
    const right = binaryExpr.getRight();
    return this.areSimpleOperands(left, right);
  }

  private areSimpleOperands(left: Node, right: Node): boolean {
    return (Node.isIdentifier(left) || Node.isNumericLiteral(left)) &&
           (Node.isIdentifier(right) || Node.isNumericLiteral(right));
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
    let parent = node.getParent();
    while (parent) {
      if (this.isDestructuringContext(parent)) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }

  private isDestructuringContext(node: Node): boolean {
    return node.getKind() === SyntaxKind.ObjectBindingPattern ||
           node.getKind() === SyntaxKind.ArrayBindingPattern ||
           node.getKind() === SyntaxKind.BindingElement;
  }

  private isInTypeContext(node: Node): boolean {
    let parent = node.getParent();
    while (parent) {
      if (this.isTypeContext(parent)) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }

  private isTypeContext(node: Node): boolean {
    return node.getKind() === SyntaxKind.TypeLiteral ||
           node.getKind() === SyntaxKind.PropertySignature ||
           node.getKind() === SyntaxKind.TypeReference;
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
      if (this.matchesVariableName(decl, variableName)) {
        return decl;
      }
    }
    return undefined;
  }

  private matchesVariableName(declaration: VariableDeclaration, variableName: string): boolean {
    if (declaration.getName() === variableName) {
      return true;
    }
    
    return this.matchesDestructuredVariable(declaration, variableName);
  }

  private matchesDestructuredVariable(declaration: VariableDeclaration, variableName: string): boolean {
    const nameNode = declaration.getNameNode();
    if (!Node.isObjectBindingPattern(nameNode)) {
      return false;
    }
    
    return this.hasMatchingElement(nameNode, variableName);
  }

  private hasMatchingElement(nameNode: Node, variableName: string): boolean {
    const bindingPattern = nameNode.asKindOrThrow(SyntaxKind.ObjectBindingPattern);
    for (const element of bindingPattern.getElements()) {
      if (element.getName() === variableName) {
        return true;
      }
    }
    return false;
  }

  private findAllReferences(sourceFile: any, variableName: string, declaration: VariableDeclaration): Node[] {
    const references: Node[] = [];
    const declarationNode = declaration.getNameNode();
    this.collectMatchingIdentifiers(sourceFile, variableName, declarationNode, references);
    return references;
  }

}