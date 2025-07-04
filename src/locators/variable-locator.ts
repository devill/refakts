import * as ts from 'typescript';
import { Project, Node, SourceFile } from 'ts-morph';
import { PositionFinder } from './position-finder';
import { VariableNodeMatcher } from './variable-node-matcher';
import { VariableResultBuilder, VariableLocation, VariableLocationResult, VariableNodeResult } from './variable-result-builder';

export { VariableLocation, VariableLocationResult, VariableNodeResult };

export class VariableLocator {
  private project: Project;
  private positionFinder = new PositionFinder();
  private nodeMatcher = new VariableNodeMatcher();
  private resultBuilder = new VariableResultBuilder();

  constructor(project?: Project) {
    this.project = project || new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
    });
  }

  async findVariableReferences(filePath: string, variableName: string): Promise<VariableLocationResult> {
    const sourceFile = this.loadSourceFile(filePath);
    const declaration = this.getDeclarationOrThrow(sourceFile, variableName);
    const usages = this.nodeMatcher.findUsages(sourceFile, variableName, declaration);
    
    return this.resultBuilder.buildLocationResult(variableName, declaration, usages);
  }


  findVariableNodesByPositionSync(sourceFile: SourceFile, line: number, column: number): VariableNodeResult {
    const declaration = this.positionFinder.getDeclarationAtPosition(sourceFile, line, column);
    const variableName = this.nodeMatcher.getVariableName(declaration);
    const usages = this.nodeMatcher.findUsages(sourceFile, variableName, declaration);
    
    return this.resultBuilder.buildNodeResult(variableName, declaration, usages);
  }

  private loadSourceFile(filePath: string): SourceFile {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    return this.project.createSourceFile(filePath, content);
  }

  private getDeclarationOrThrow(sourceFile: SourceFile, variableName: string): Node {
    const declaration = this.nodeMatcher.findDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Could not find declaration for variable: ${variableName}`);
    }
    return declaration;
  }

}