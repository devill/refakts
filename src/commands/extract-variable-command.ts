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
    
    if (options.all) {
      const targetNodes = this.tsQueryHandler.findNodesByQuery(sourceFile, options.query);
      if (targetNodes.length === 0) {
        throw new Error(`No matches found for query: ${options.query}`);
      }
      await this.extractAllOccurrences(targetNodes[0], options.name);
    } else {
      // For single extraction, use findNodesByQuery and take the first match
      const targetNodes = this.tsQueryHandler.findNodesByQuery(sourceFile, options.query);
      if (targetNodes.length === 0) {
        throw new Error(`No matches found for query: ${options.query}`);
      }
      await this.extractSingleOccurrence(targetNodes[0], options.name);
    }
    
    await sourceFile.save();
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
    if (!Node.isExpression(targetNode)) {
      throw new Error('Selected node must be an expression');
    }

    const scope = this.findExtractionScope(targetNode);
    const uniqueName = this.generateUniqueName(variableName, scope);
    
    this.insertVariableDeclaration(targetNode, uniqueName);
    targetNode.replaceWithText(uniqueName);
  }

  private async extractAllOccurrences(targetNode: Node, variableName: string): Promise<void> {
    if (!Node.isExpression(targetNode)) {
      throw new Error('Selected node must be an expression');
    }

    const sourceFile = targetNode.getSourceFile();
    const expressionText = targetNode.getText();
    
    // Find all matching expressions in the entire source file
    const allMatchingExpressions = this.findMatchingExpressions(sourceFile, expressionText);
    
    if (allMatchingExpressions.length === 0) {
      throw new Error('No matching expressions found');
    }

    // Group expressions by their extraction scope (function/block)
    const expressionsByScope = new Map<Node, Expression[]>();
    
    for (const expression of allMatchingExpressions) {
      const scope = this.findExtractionScope(expression);
      if (!expressionsByScope.has(scope)) {
        expressionsByScope.set(scope, []);
      }
      expressionsByScope.get(scope)!.push(expression);
    }

    // Extract variables in each scope separately
    for (const [scope, expressions] of expressionsByScope) {
      const uniqueName = this.generateUniqueName(variableName, scope);
      
      // Insert variable declaration before the first expression in this scope
      this.insertVariableDeclaration(expressions[0], uniqueName);
      
      // Replace all matching expressions in this scope
      for (const expression of expressions) {
        expression.replaceWithText(uniqueName);
      }
    }
  }

  private findExtractionScope(node: Node): Node {
    // Find the nearest statement that can contain variable declarations
    let current: Node | undefined = node;
    while (current) {
      const parent = current.getParent();
      if (Node.isBlock(parent) || Node.isSourceFile(parent)) {
        return parent;
      }
      current = parent;
    }
    return node.getSourceFile();
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
      if (Node.isVariableDeclaration(node)) {
        const nameNode = node.getNameNode();
        if (Node.isIdentifier(nameNode)) {
          names.add(nameNode.getText());
        }
      }
      if (Node.isParameterDeclaration(node)) {
        const nameNode = node.getNameNode();
        if (Node.isIdentifier(nameNode)) {
          names.add(nameNode.getText());
        }
      }
    });
    
    return names;
  }

  private insertVariableDeclaration(beforeNode: Node, variableName: string): void {
    const expressionText = beforeNode.getText();
    const statement = this.findContainingStatement(beforeNode);
    
    if (!statement) {
      throw new Error('Cannot find containing statement for variable declaration');
    }

    const declarationText = `const ${variableName} = ${expressionText};`;
    
    // Insert the variable declaration before the containing statement
    const parent = statement.getParent();
    if (Node.isBlock(parent)) {
      const statements = parent.getStatements();
      const index = statements.findIndex(s => s === statement);
      if (index !== -1) {
        parent.insertStatements(index, [declarationText]);
      }
    } else if (Node.isSourceFile(parent)) {
      const statements = parent.getStatements();
      const index = statements.findIndex(s => s === statement);
      if (index !== -1) {
        parent.insertStatements(index, [declarationText]);
      }
    }
  }

  private findContainingStatement(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      const parent = current.getParent();
      if (Node.isBlock(parent) || Node.isSourceFile(parent)) {
        return current;
      }
      current = parent;
    }
    return undefined;
  }

  private findMatchingExpressions(scope: Node, expressionText: string): Expression[] {
    const expressions: Expression[] = [];
    
    scope.forEachDescendant((node) => {
      if (Node.isExpression(node) && node.getText() === expressionText) {
        expressions.push(node);
      }
    });
    
    return expressions;
  }
}