import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import * as path from 'path';

export class BoundaryAnalyzer {
  findBoundaryMatches(sourceFile: SourceFile, options: Record<string, any>): SelectResult[] {
    const pattern = options.regex;
    const boundaryType = options.boundaries;
    const fileName = path.basename(sourceFile.getFilePath());
    
    if (boundaryType === 'function') {
      return this.findFunctionBoundaryMatches(sourceFile, pattern, fileName);
    }
    
    return [];
  }

  private findFunctionBoundaryMatches(sourceFile: SourceFile, pattern: string, fileName: string): SelectResult[] {
    const regex = new RegExp(pattern);
    const allFunctions = this.getAllFunctions(sourceFile);
    
    return this.filterAndFormatMatches(allFunctions, regex, fileName);
  }

  private getAllFunctions(sourceFile: SourceFile): Node[] {
    const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
    const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
    const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
    
    return [...functions, ...methods, ...arrowFunctions];
  }

  private filterAndFormatMatches(functions: Node[], regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const func of functions) {
      if (this.functionMatchesPattern(func, regex)) {
        results.push(this.formatFunctionResult(func, fileName));
      }
    }
    
    return results;
  }

  private functionMatchesPattern(func: Node, regex: RegExp): boolean {
    return regex.test(func.getText());
  }

  private formatFunctionResult(func: Node, fileName: string): SelectResult {
    const positions = this.getFunctionPositions(func);
    
    return {
      location: `[${fileName} ${positions.startLine}:-${positions.endLine}:]`,
      content: func.getText()
    };
  }

  private getFunctionPositions(func: Node) {
    const sourceFile = func.getSourceFile();
    const nodePositions = this.getNodePositions(func);
    
    return this.createLinePositions(sourceFile, nodePositions);
  }

  private getNodePositions(func: Node) {
    return {
      start: func.getStart(),
      end: func.getEnd()
    };
  }

  private createLinePositions(sourceFile: any, nodePositions: any) {
    const startPos = sourceFile.getLineAndColumnAtPos(nodePositions.start);
    const endPos = sourceFile.getLineAndColumnAtPos(nodePositions.end);
    
    return {
      startLine: startPos.line,
      endLine: endPos.line
    };
  }
}