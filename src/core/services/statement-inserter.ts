import { Node, Block, SourceFile, Statement } from 'ts-morph';
import { ExtractionScopeAnalyzer } from '../../services/extraction-scope-analyzer';

export class StatementInserter {
  private scopeAnalyzer: ExtractionScopeAnalyzer;

  constructor() {
    this.scopeAnalyzer = new ExtractionScopeAnalyzer();
  }

  insertVariableDeclaration(beforeNode: Node, variableName: string): void {
    const statement = this.scopeAnalyzer.findContainingStatement(beforeNode);
    if (!statement) {
      throw new Error('Cannot find containing statement for variable declaration');
    }

    const declarationText = this.createDeclarationText(beforeNode, variableName);
    this.insertDeclarationAtStatement(statement, declarationText);
  }

  createDeclarationText(node: Node, variableName: string): string {
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

  private insertInBlock(parent: Block, statement: Node, declarationText: string): void {
    const statements = parent.getStatements();
    const index = statements.findIndex((s: Statement) => s === statement);
    if (index !== -1) {
      parent.insertStatements(index, [declarationText]);
    }
  }

  private insertInSourceFile(parent: SourceFile, statement: Node, declarationText: string): void {
    const statements = parent.getStatements();
    const index = statements.findIndex((s: Statement) => s === statement);
    if (index !== -1) {
      parent.insertStatements(index, [declarationText]);
    }
  }
}