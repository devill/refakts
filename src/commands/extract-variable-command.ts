import { RefactoringCommand } from '../command';
import { Project, Node, Expression, VariableDeclarationKind, Scope } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
import * as path from 'path';

export class ExtractVariableCommand implements RefactoringCommand {
  readonly name = 'extract-variable';
  readonly description = 'Extract expression into a variable';
  readonly complete = true;

  private project = new Project();
  private tsQueryHandler = new TSQueryHandler();

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    const sourceFile = this.loadSourceFile(file);
    const targetNode = this.findTargetNode(sourceFile, options.query);
    
    await this.performExtraction(targetNode, options);
    await sourceFile.save();
  }

  private async performExtraction(targetNode: Node, options: Record<string, any>): Promise<void> {
    if (options.all) {
      await this.extractAllOccurrences(targetNode, options.name);
    } else {
      await this.extractSingleOccurrence(targetNode, options.name);
    }
  }

  private findTargetNode(sourceFile: any, query: string): Node {
    const targetNodes = this.tsQueryHandler.findNodesByQuery(sourceFile, query);
    if (targetNodes.length === 0) {
      throw new Error(`No matches found for query: ${query}`);
    }
    return targetNodes[0];
  }

  validateOptions(options: Record<string, any>): void {
    if (!options.query) {
      throw new Error('--query must be specified');
    }
    if (!options.name) {
      throw new Error('--name must be specified');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts extract-variable src/file.ts --query "BinaryExpression" --name "result"\n  refakts extract-variable src/file.ts --query "CallExpression" --name "result" --all';
  }

  private loadSourceFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return this.project.addSourceFileAtPath(absolutePath);
  }

  private async extractSingleOccurrence(targetNode: Node, variableName: string): Promise<void> {
    this.validateExpressionNode(targetNode);
    const scope = this.findExtractionScope(targetNode);
    const uniqueName = this.generateUniqueName(variableName, scope);
    
    this.insertVariableDeclaration(targetNode, uniqueName);
    targetNode.replaceWithText(uniqueName);
  }

  private async extractAllOccurrences(targetNode: Node, variableName: string): Promise<void> {
    this.validateExpressionNode(targetNode);
    const allExpressions = this.findAllMatchingExpressions(targetNode);
    this.validateExpressionsFound(allExpressions);
    
    const groupedExpressions = this.groupExpressionsByScope(allExpressions);
    this.extractInEachScope(groupedExpressions, variableName);
  }

  private findAllMatchingExpressions(targetNode: Node): Expression[] {
    const expressionText = targetNode.getText();
    const sourceFile = targetNode.getSourceFile();
    return this.findMatchingExpressions(sourceFile, expressionText);
  }

  private validateExpressionNode(node: Node): void {
    if (!Node.isExpression(node)) {
      throw new Error('Selected node must be an expression');
    }
  }

  private validateExpressionsFound(expressions: Expression[]): void {
    if (expressions.length === 0) {
      throw new Error('No matching expressions found');
    }
  }

  private groupExpressionsByScope(expressions: Expression[]): Map<Node, Expression[]> {
    const groupedExpressions = new Map<Node, Expression[]>();
    
    for (const expression of expressions) {
      this.addExpressionToScope(groupedExpressions, expression);
    }
    
    return groupedExpressions;
  }

  private addExpressionToScope(groupedExpressions: Map<Node, Expression[]>, expression: Expression): void {
    const scope = this.findExtractionScope(expression);
    if (!groupedExpressions.has(scope)) {
      groupedExpressions.set(scope, []);
    }
    groupedExpressions.get(scope)!.push(expression);
  }

  private extractInEachScope(expressionsByScope: Map<Node, Expression[]>, variableName: string): void {
    for (const [scope, expressions] of expressionsByScope) {
      const uniqueName = this.generateUniqueName(variableName, scope);
      this.insertVariableDeclaration(expressions[0], uniqueName);
      
      for (const expression of expressions) {
        expression.replaceWithText(uniqueName);
      }
    }
  }

  private findExtractionScope(node: Node): Node {
    const scope = this.searchForValidScope(node);
    return scope || node.getSourceFile();
  }

  private searchForValidScope(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      const validScope = this.checkCurrentNodeForValidScope(current);
      if (validScope) return validScope;
      current = current.getParent();
    }
    return undefined;
  }

  private checkCurrentNodeForValidScope(current: Node): Node | undefined {
    const parent = current.getParent();
    return this.isValidExtractionScope(parent) ? parent : undefined;
  }

  private isValidExtractionScope(parent: Node | undefined): parent is Node {
    return parent !== undefined && (Node.isBlock(parent) || Node.isSourceFile(parent));
  }

  private generateUniqueName(baseName: string, scope: Node): string {
    const existingNames = this.getExistingVariableNames(scope);
    
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    throw new Error(`Variable name '${baseName}' already exists in this scope. Please choose a different name.`);
  }

  private getExistingVariableNames(scope: Node): Set<string> {
    const names = new Set<string>();
    
    scope.forEachDescendant((node) => {
      this.addVariableNameIfExists(node, names);
      this.addParameterNameIfExists(node, names);
    });
    
    return names;
  }

  private addVariableNameIfExists(node: Node, names: Set<string>): void {
    if (Node.isVariableDeclaration(node)) {
      const nameNode = node.getNameNode();
      if (Node.isIdentifier(nameNode)) {
        names.add(nameNode.getText());
      }
    }
  }

  private addParameterNameIfExists(node: Node, names: Set<string>): void {
    if (Node.isParameterDeclaration(node)) {
      const nameNode = node.getNameNode();
      if (Node.isIdentifier(nameNode)) {
        names.add(nameNode.getText());
      }
    }
  }

  private insertVariableDeclaration(beforeNode: Node, variableName: string): void {
    const statement = this.findContainingStatement(beforeNode);
    if (!statement) {
      throw new Error('Cannot find containing statement for variable declaration');
    }

    const declarationText = this.createDeclarationText(beforeNode, variableName);
    this.insertDeclarationAtStatement(statement, declarationText);
  }

  private createDeclarationText(node: Node, variableName: string): string {
    const expressionText = node.getText();
    return `const ${variableName} = ${expressionText};`;
  }

  private insertDeclarationAtStatement(statement: Node, declarationText: string): void {
    const parent = statement.getParent();
    if (Node.isBlock(parent) || Node.isSourceFile(parent)) {
      this.insertAtStatementIndex(parent, statement, declarationText);
    }
  }

  private insertAtStatementIndex(parent: Node, statement: Node, declarationText: string): void {
    if (Node.isBlock(parent)) {
      this.insertInBlock(parent, statement, declarationText);
    } else if (Node.isSourceFile(parent)) {
      this.insertInSourceFile(parent, statement, declarationText);
    }
  }

  private insertInBlock(parent: any, statement: Node, declarationText: string): void {
    const statements = parent.getStatements();
    const index = statements.findIndex((s: any) => s === statement);
    if (index !== -1) {
      parent.insertStatements(index, [declarationText]);
    }
  }

  private insertInSourceFile(parent: any, statement: Node, declarationText: string): void {
    const statements = parent.getStatements();
    const index = statements.findIndex((s: any) => s === statement);
    if (index !== -1) {
      parent.insertStatements(index, [declarationText]);
    }
  }

  private findContainingStatement(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      if (this.isContainingStatement(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  private isContainingStatement(current: Node): boolean {
    const parent = current.getParent();
    return this.isValidExtractionScope(parent);
  }

  private findMatchingExpressions(scope: Node, expressionText: string): Expression[] {
    const expressions: Expression[] = [];
    
    scope.forEachDescendant((node) => {
      this.addMatchingExpression(node, expressionText, expressions);
    });
    
    return expressions;
  }

  private addMatchingExpression(node: Node, expressionText: string, expressions: Expression[]): void {
    if (Node.isExpression(node) && node.getText() === expressionText) {
      expressions.push(node);
    }
  }
}