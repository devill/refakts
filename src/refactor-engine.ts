import { Project, Node, VariableDeclaration } from 'ts-morph';
import * as path from 'path';
import { TSQueryHandler } from './tsquery-handler';
import { VariableDeclarationFinder } from './variable-declaration-finder';
import { ExpressionAnalyzer } from './expression-analyzer';
import { VariableReplacer } from './variable-replacer';

export class RefactorEngine {
  private project: Project;
  private tsQueryHandler = new TSQueryHandler();
  private declarationFinder = new VariableDeclarationFinder();
  private expressionAnalyzer = new ExpressionAnalyzer();
  private variableReplacer = new VariableReplacer();

  constructor() {
    this.project = new Project();
  }

  async inlineVariableByQuery(filePath: string, query: string): Promise<void> {
    const sourceFile = this.loadSourceFile(filePath);
    const node = this.tsQueryHandler.findNodeByQuery(sourceFile, query);
    await this.performInlineVariable(node);
    await sourceFile.save();
  }

  async renameByQuery(filePath: string, query: string, newName: string): Promise<void> {
    const sourceFile = this.loadSourceFile(filePath);
    const node = this.tsQueryHandler.findNodeByQuery(sourceFile, query);
    await this.performRename(node, newName);
    await sourceFile.save();
  }

  private async performInlineVariable(node: Node): Promise<void> {
    this.validateIdentifierNode(node);
    const variableName = node.getText();
    const sourceFile = node.getSourceFile();
    const declaration = this.declarationFinder.findVariableDeclaration(sourceFile, variableName);
    const initializerText = this.getInitializerText(declaration, variableName);
    this.variableReplacer.replaceAllReferences(sourceFile, variableName, declaration, initializerText);
    this.variableReplacer.removeDeclaration(declaration);
  }

  private async performRename(node: Node, newName: string): Promise<void> {
    this.validateIdentifierNode(node);
    const oldName = node.getText();
    const sourceFile = node.getSourceFile();
    
    this.renameDeclaration(node, newName);
    this.renameAllReferences(sourceFile, oldName, node, newName);
  }

  private renameDeclaration(node: Node, newName: string): void {
    node.replaceWithText(newName);
  }

  private renameAllReferences(sourceFile: any, oldName: string, declarationNode: Node, newName: string): void {
    const references = this.findAllReferences(sourceFile, oldName, declarationNode);
    references.forEach(ref => {
      ref.replaceWithText(newName);
    });
  }

  private findAllReferences(sourceFile: any, variableName: string, declarationNode: Node): Node[] {
    const references: Node[] = [];
    
    sourceFile.forEachDescendant((node: Node) => {
      if (this.isMatchingReference(node, variableName, declarationNode)) {
        references.push(node);
      }
    });
    return references;
  }

  private isMatchingReference(node: Node, variableName: string, declarationNode: Node): boolean {
    return node.getKind() === 80 && 
           node.getText() === variableName && 
           node !== declarationNode;
  }

  private getDeclarationScope(declarationNode: Node): Node {
    const parameterScope = this.tryGetParameterScope(declarationNode);
    if (parameterScope) {
      return parameterScope;
    }
    
    return this.findClosestBlockScope(declarationNode);
  }

  private tryGetParameterScope(declarationNode: Node): Node | null {
    const parent = declarationNode.getParent();
    if (!this.isParameterParent(parent)) {
      return null;
    }
    
    return this.getFunctionFromParameter(parent!);
  }

  private isParameterParent(parent: Node | undefined): boolean {
    return parent !== undefined && Node.isParameterDeclaration(parent);
  }

  private getFunctionFromParameter(parent: Node): Node | null {
    const functionNode = parent.getParent();
    if (functionNode && this.isFunctionNode(functionNode)) {
      return functionNode;
    }
    return null;
  }

  private isFunctionNode(node: Node): boolean {
    return Node.isFunctionDeclaration(node) || Node.isArrowFunction(node);
  }

  private findClosestBlockScope(declarationNode: Node): Node {
    let current = declarationNode.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return declarationNode.getSourceFile();
  }

  private isScopeNode(node: Node): boolean {
    return Node.isFunctionDeclaration(node) || 
           Node.isArrowFunction(node) || 
           Node.isBlock(node) ||
           Node.isSourceFile(node);
  }

  private isInSameScope(node: Node, targetScope: Node): boolean {
    let current = node.getParent();
    while (current) {
      const scopeResult = this.checkScopeRelation(current, targetScope);
      if (scopeResult !== null) {
        return scopeResult;
      }
      current = current.getParent();
    }
    return false;
  }

  private checkScopeRelation(current: Node, targetScope: Node): boolean | null {
    if (this.isTargetScope(current, targetScope)) {
      return true;
    }
    if (this.isScopeBoundary(current)) {
      return false;
    }
    return null;
  }

  private isTargetScope(current: Node, targetScope: Node): boolean {
    return current === targetScope;
  }

  private isScopeBoundary(node: Node): boolean {
    return Node.isFunctionDeclaration(node) || 
           Node.isArrowFunction(node) || 
           Node.isBlock(node);
  }

  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
  }

  private validateIdentifierNode(node: Node): void {
    if (node.getKind() !== 80) {
      throw new Error(`Expected identifier, got ${node.getKindName()}`);
    }
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
    
    return this.expressionAnalyzer.formatWithParentheses(initializer, context);
  }
}