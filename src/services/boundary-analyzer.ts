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
    const results: SelectResult[] = [];
    
    // Use AST to find function declarations
    const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
    const methods = sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
    const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
    
    const allFunctions = [...functions, ...methods, ...arrowFunctions];
    
    for (const func of allFunctions) {
      const funcText = func.getText();
      if (regex.test(funcText)) {
        const start = func.getStart();
        const end = func.getEnd();
        const startPos = sourceFile.getLineAndColumnAtPos(start);
        const endPos = sourceFile.getLineAndColumnAtPos(end);
        
        results.push({
          location: `[${fileName} ${startPos.line}:-${endPos.line}:]`,
          content: funcText
        });
      }
    }
    
    return results;
  }
}