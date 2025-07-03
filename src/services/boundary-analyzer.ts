import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import * as path from 'path';

export class BoundaryAnalyzer {
  findBoundaryMatches(sourceFile: SourceFile, options: Record<string, any>): SelectResult[] {
    const matchContext = this.prepareBoundaryContext(sourceFile, options);
    return this.executeBoundaryMatching(matchContext);
  }

  private prepareBoundaryContext(sourceFile: SourceFile, options: Record<string, any>) {
    return {
      sourceFile,
      pattern: options.regex,
      boundaryType: options.boundaries,
      fileName: path.basename(sourceFile.getFilePath())
    };
  }

  private executeBoundaryMatching(context: any): SelectResult[] {
    if (context.boundaryType === 'function') {
      return this.findFunctionBoundaryMatches(context.sourceFile, context.pattern, context.fileName);
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
    return this.processAllFunctions(functions, regex, fileName);
  }

  private processAllFunctions(functions: Node[], regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const func of functions) {
      const result = this.processFunction(func, regex, fileName);
      if (result) results.push(result);
    }
    
    return results;
  }

  private processFunction(func: Node, regex: RegExp, fileName: string): SelectResult | null {
    return this.functionMatchesPattern(func, regex) 
      ? this.formatFunctionResult(func, fileName) 
      : null;
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