import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import * as path from 'path';

export class StructuralAnalyzer {
  findStructuralMatches(sourceFile: SourceFile, options: Record<string, any>): SelectResult[] {
    const pattern = options.regex;
    const fileName = path.basename(sourceFile.getFilePath());
    const regex = new RegExp(pattern);
    const results: SelectResult[] = [];
    
    if (options.includeFields || options['include-fields']) {
      const fieldMatches = this.findASTFieldMatches(sourceFile, regex, fileName);
      results.push(...fieldMatches);
    }
    
    if (options.includeMethods || options['include-methods']) {
      const methodMatches = this.findASTMethodMatches(sourceFile, regex, fileName);
      results.push(...methodMatches);
    }
    
    return results;
  }

  private findASTFieldMatches(sourceFile: SourceFile, regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    const classes = sourceFile.getClasses();
    for (const classDecl of classes) {
      const properties = classDecl.getProperties();
      for (const prop of properties) {
        const name = prop.getName();
        if (regex.test(name)) {
          const nameNode = prop.getNameNode();
          const start = nameNode.getStart();
          const end = nameNode.getEnd();
          const startPos = sourceFile.getLineAndColumnAtPos(start);
          const endPos = sourceFile.getLineAndColumnAtPos(end);
          
          results.push({
            location: `[${fileName} ${startPos.line}:${startPos.column}-${endPos.line}:${endPos.column}]`,
            content: name
          });
        }
      }
    }
    
    return results;
  }

  private findASTMethodMatches(sourceFile: SourceFile, regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    const classes = sourceFile.getClasses();
    for (const classDecl of classes) {
      const methods = classDecl.getMethods();
      for (const method of methods) {
        const name = method.getName();
        if (regex.test(name)) {
          const start = method.getStart();
          const end = method.getEnd();
          const startPos = sourceFile.getLineAndColumnAtPos(start);
          const endPos = sourceFile.getLineAndColumnAtPos(end);
          
          results.push({
            location: `[${fileName} ${startPos.line}:-${endPos.line}:]`,
            content: method.getText()
          });
        }
      }
    }
    
    return results;
  }
}