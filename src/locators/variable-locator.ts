import * as ts from 'typescript';
import { Project, Node, SourceFile } from 'ts-morph';

export interface VariableLocation {
  kind: 'declaration' | 'usage';
  line: number;
  column: number;
  text: string;
}

export interface VariableLocationResult {
  variable: string;
  declaration: VariableLocation;
  usages: VariableLocation[];
}

export class VariableLocator {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
    });
  }

  async findVariableReferences(filePath: string, variableName: string): Promise<VariableLocationResult> {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = this.project.createSourceFile(filePath, content);
    
    const declaration = this.findDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Could not find declaration for variable: ${variableName}`);
    }

    const usages = this.findUsages(sourceFile, variableName, declaration);

    return {
      variable: variableName,
      declaration: this.createLocation(declaration, 'declaration'),
      usages: usages.map(usage => this.createLocation(usage, 'usage'))
    };
  }

  private findDeclaration(sourceFile: SourceFile, variableName: string): Node | undefined {
    let declaration: Node | undefined;
    
    sourceFile.forEachDescendant((node: Node) => {
      if (node.getKind() === ts.SyntaxKind.VariableDeclaration) {
        const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
        if (identifier?.getText() === variableName) {
          declaration = node;
          return true; // Stop traversal
        }
      }
      
      if (node.getKind() === ts.SyntaxKind.Parameter) {
        const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
        if (identifier?.getText() === variableName) {
          declaration = node;
          return true; // Stop traversal
        }
      }
    });
    
    return declaration;
  }

  private findUsages(sourceFile: SourceFile, variableName: string, declaration: Node): Node[] {
    const usages: Node[] = [];
    const declarationIdentifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    
    sourceFile.forEachDescendant((node: Node) => {
      if (node.getKind() === ts.SyntaxKind.Identifier && 
          node.getText() === variableName && 
          node !== declarationIdentifier) {
        usages.push(node);
      }
    });
    
    return usages;
  }

  private createLocation(node: Node, kind: 'declaration' | 'usage'): VariableLocation {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    
    return {
      kind,
      line: lineAndColumn.line,
      column: lineAndColumn.column,
      text: node.getText()
    };
  }
}