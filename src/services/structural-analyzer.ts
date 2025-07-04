import { SourceFile } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import * as path from 'path';

export class StructuralAnalyzer {
  findStructuralMatches(sourceFile: SourceFile, options: Record<string, any>): SelectResult[] {
    const { regex, fileName } = this.prepareMatchingContext(sourceFile, options);
    return this.collectAllMatches(sourceFile, regex, fileName, options);
  }

  private prepareMatchingContext(sourceFile: SourceFile, options: Record<string, any>) {
    const pattern = options.regex;
    const fileName = path.basename(sourceFile.getFilePath());
    const regex = new RegExp(pattern);
    return { regex, fileName };
  }

  private collectAllMatches(sourceFile: SourceFile, regex: RegExp, fileName: string, options: Record<string, any>): SelectResult[] {
    const results: SelectResult[] = [];
    
    this.addFieldMatches(sourceFile, regex, fileName, options, results);
    this.addMethodMatches(sourceFile, regex, fileName, options, results);
    
    return results;
  }

  private addFieldMatches(sourceFile: SourceFile, regex: RegExp, fileName: string, options: Record<string, any>, results: SelectResult[]): void {
    if (this.shouldIncludeFields(options)) {
      results.push(...this.findASTFieldMatches(sourceFile, regex, fileName));
    }
  }

  private addMethodMatches(sourceFile: SourceFile, regex: RegExp, fileName: string, options: Record<string, any>, results: SelectResult[]): void {
    if (this.shouldIncludeMethods(options)) {
      results.push(...this.findASTMethodMatches(sourceFile, regex, fileName));
    }
  }

  private shouldIncludeFields(options: Record<string, any>): boolean {
    return options.includeFields || options['include-fields'];
  }

  private shouldIncludeMethods(options: Record<string, any>): boolean {
    return options.includeMethods || options['include-methods'];
  }

  private findASTFieldMatches(sourceFile: SourceFile, regex: RegExp, fileName: string): SelectResult[] {
    const classes = sourceFile.getClasses();
    return this.collectFieldsFromClasses(classes, regex, fileName);
  }

  private collectFieldsFromClasses(classes: any[], regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const classDecl of classes) {
      const fieldMatches = this.getMatchingFields(classDecl, regex, fileName);
      results.push(...fieldMatches);
    }
    
    return results;
  }

  private getMatchingFields(classDecl: any, regex: RegExp, fileName: string): SelectResult[] {
    const properties = classDecl.getProperties();
    return this.filterAndFormatProperties(properties, regex, fileName);
  }

  private filterAndFormatProperties(properties: any[], regex: RegExp, fileName: string): SelectResult[] {
    return this.processAllProperties(properties, regex, fileName);
  }

  private processAllProperties(properties: any[], regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const prop of properties) {
      const result = this.processProperty(prop, regex, fileName);
      if (result) results.push(result);
    }
    
    return results;
  }

  private processProperty(prop: any, regex: RegExp, fileName: string): SelectResult | null {
    return this.propertyMatches(prop, regex) 
      ? this.formatFieldResult(prop, fileName) 
      : null;
  }

  private propertyMatches(prop: any, regex: RegExp): boolean {
    return regex.test(prop.getName());
  }

  private formatFieldResult(prop: any, fileName: string): SelectResult {
    const positions = this.getPropertyPositions(prop);
    
    return {
      location: `[${fileName} ${positions.startLine}:${positions.startColumn}-${positions.endLine}:${positions.endColumn}]`,
      content: prop.getName()
    };
  }

  private getPropertyPositions(prop: any) {
    const nameNode = prop.getNameNode();
    const start = nameNode.getStart();
    const end = nameNode.getEnd();
    const sourceFile = prop.getSourceFile();
    const startPos = sourceFile.getLineAndColumnAtPos(start);
    const endPos = sourceFile.getLineAndColumnAtPos(end);
    
    return { startLine: startPos.line, startColumn: startPos.column, endLine: endPos.line, endColumn: endPos.column };
  }

  private findASTMethodMatches(sourceFile: SourceFile, regex: RegExp, fileName: string): SelectResult[] {
    const classes = sourceFile.getClasses();
    return this.collectMethodsFromClasses(classes, regex, fileName);
  }

  private collectMethodsFromClasses(classes: any[], regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const classDecl of classes) {
      const methodMatches = this.getMatchingMethods(classDecl, regex, fileName);
      results.push(...methodMatches);
    }
    
    return results;
  }

  private getMatchingMethods(classDecl: any, regex: RegExp, fileName: string): SelectResult[] {
    const methods = classDecl.getMethods();
    return this.filterAndFormatMethods(methods, regex, fileName);
  }

  private filterAndFormatMethods(methods: any[], regex: RegExp, fileName: string): SelectResult[] {
    return this.processAllMethods(methods, regex, fileName);
  }

  private processAllMethods(methods: any[], regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const method of methods) {
      const result = this.processMethod(method, regex, fileName);
      if (result) results.push(result);
    }
    
    return results;
  }

  private processMethod(method: any, regex: RegExp, fileName: string): SelectResult | null {
    return this.methodMatches(method, regex) 
      ? this.formatMethodResult(method, fileName) 
      : null;
  }

  private methodMatches(method: any, regex: RegExp): boolean {
    return regex.test(method.getName());
  }

  private formatMethodResult(method: any, fileName: string): SelectResult {
    const positions = this.getMethodPositions(method);
    
    return {
      location: `[${fileName} ${positions.startLine}:-${positions.endLine}:]`,
      content: method.getText()
    };
  }

  private getMethodPositions(method: any) {
    const start = method.getStart();
    const end = method.getEnd();
    const sourceFile = method.getSourceFile();
    const startPos = sourceFile.getLineAndColumnAtPos(start);
    const endPos = sourceFile.getLineAndColumnAtPos(end);
    
    return { startLine: startPos.line, endLine: endPos.line };
  }
}