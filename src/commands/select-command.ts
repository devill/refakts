import { RefactoringCommand } from '../command';
import * as fs from 'fs';
import * as path from 'path';
import { SelectMatch, SelectResult } from './select/select-types';
import { SelectPatternMatcher } from './select/pattern-matcher';
import { SelectResultFormatter, BasicFormatter, LineFormatter, PreviewFormatter, DefinitionFormatter } from './select/result-formatters';
import { SelectOutputHandler } from './select/output-handler';

export class SelectCommand implements RefactoringCommand {
  readonly name = 'select';
  readonly description = 'Find code elements and return their locations with content preview';
  readonly complete = true;

  private matcher = new SelectPatternMatcher();
  private outputHandler = new SelectOutputHandler();
  private formatters = new Map<string, SelectResultFormatter>([
    ['basic', new BasicFormatter()],
    ['line', new LineFormatter()],
    ['preview', new PreviewFormatter()],
    ['definition', new DefinitionFormatter()]
  ]);

  async execute(file: string, options: Record<string, any>): Promise<void> {
    this.validateOptions(options);
    
    try {
      const results = await this.findMatches(file, options);
      this.outputHandler.outputResults(results);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async findMatches(file: string, options: Record<string, any>): Promise<SelectResult[]> {
    const content = fs.readFileSync(file, 'utf8');
    
    if (options.range) {
      return this.findRangeMatches(content, file, options);
    } else if (options.structural) {
      return this.findStructuralMatches(content, file, options);
    } else if (options.boundaries) {
      return this.findBoundaryMatches(content, file, options);
    } else {
      const patterns = this.createRegexPatterns(options.regex);
      const allMatches = this.findAllPatternMatches(content, patterns);
      return this.processMatches(allMatches, file, options);
    }
  }

  private createRegexPatterns(regexOption: string | string[]): RegExp[] {
    const regexStrings = Array.isArray(regexOption) ? regexOption : [regexOption];
    return regexStrings.map(regex => new RegExp(regex, 'g'));
  }

  private findAllPatternMatches(content: string, patterns: RegExp[]): SelectMatch[] {
    const allMatches: SelectMatch[] = [];
    
    for (const pattern of patterns) {
      const matches = this.matcher.findMatches(content, pattern);
      allMatches.push(...matches);
    }
    
    return this.sortMatchesByPosition(allMatches);
  }

  private sortMatchesByPosition(matches: SelectMatch[]): SelectMatch[] {
    return matches.sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      return a.column - b.column;
    });
  }


  private findRangeMatches(content: string, file: string, options: Record<string, any>): SelectResult[] {
    const startRegex = options.startRegex || options['start-regex'];
    const endRegex = options.endRegex || options['end-regex'];
    
    const ranges = this.findContentRanges(content, startRegex, endRegex);
    const fileName = path.basename(file);
    
    if (ranges.length === 0) {
      return [{ location: 'No Matches' }];
    }
    
    return ranges.map(range => ({
      location: `\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`,
      content: `${range.content}\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`
    }));
  }

  private findContentRanges(content: string, startRegex: string, endRegex: string): any[] {
    const lines = content.split('\n');
    const ranges = [];
    const startPattern = new RegExp(startRegex);
    const endPattern = new RegExp(endRegex);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comment lines
      if (this.isCommentLine(line)) {
        continue;
      }
      
      const startMatch = startPattern.exec(line);
      if (startMatch) {
        const rangeStart = { line: i + 1, column: startMatch.index + 1 };
        
        for (let j = i; j < lines.length; j++) {
          const endLine = lines[j];
          
          // Skip comment lines for end pattern too
          if (this.isCommentLine(endLine)) {
            continue;
          }
          
          const endMatch = endPattern.exec(endLine);
          if (endMatch) {
            const rangeEnd = { line: j + 1, column: endMatch.index + endMatch[0].length + 1 };
            const contentLines = lines.slice(i, j + 1);
            
            ranges.push({
              startLine: rangeStart.line,
              startColumn: rangeStart.column,
              endLine: rangeEnd.line,
              endColumn: rangeEnd.column,
              content: contentLines.join('\n')
            });
            
            i = j;
            break;
          }
        }
      }
    }
    
    return ranges;
  }

  private isCommentLine(line: string): boolean {
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*');
  }

  private async findStructuralMatches(content: string, file: string, options: Record<string, any>): Promise<SelectResult[]> {
    const { Project } = require('ts-morph');
    const pattern = options.regex;
    const fileName = path.basename(file);
    const regex = new RegExp(pattern);
    const selectResults: SelectResult[] = [];
    
    const project = new Project();
    const sourceFile = project.createSourceFile('temp.ts', content);
    
    if (options.includeFields || options['include-fields']) {
      const fieldMatches = this.findASTFieldMatches(sourceFile, regex, fileName);
      selectResults.push(...fieldMatches);
    }
    
    if (options.includeMethods || options['include-methods']) {
      const methodMatches = this.findASTMethodMatches(sourceFile, regex, fileName);
      selectResults.push(...methodMatches);
    }
    
    return selectResults;
  }

  private findASTFieldMatches(sourceFile: any, regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    // Find property declarations in classes
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

  private findASTMethodMatches(sourceFile: any, regex: RegExp, fileName: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    // Find method declarations in classes
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

  private findBoundaryMatches(content: string, file: string, options: Record<string, any>): SelectResult[] {
    const pattern = options.regex;
    const boundaryType = options.boundaries;
    const fileName = path.basename(file);
    
    if (boundaryType === 'function') {
      return this.findFunctionBoundaryMatches(content, pattern, fileName);
    }
    
    return [];
  }

  private findFunctionBoundaryMatches(content: string, pattern: string, fileName: string): SelectResult[] {
    const lines = content.split('\n');
    const regex = new RegExp(pattern);
    const results: SelectResult[] = [];
    const processedFunctions = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comment lines
      if (this.isCommentLine(line)) {
        continue;
      }
      
      if (regex.test(line)) {
        const functionBlock = this.findFunctionBlock(lines, i);
        if (functionBlock) {
          const functionKey = `${functionBlock.startLine}-${functionBlock.endLine}`;
          if (!processedFunctions.has(functionKey)) {
            processedFunctions.add(functionKey);
            results.push({
              location: `[${fileName} ${functionBlock.startLine}:-${functionBlock.endLine}:]`,
              content: functionBlock.content
            });
          }
        }
      }
    }
    
    return results;
  }

  private findFunctionBlock(lines: string[], startIndex: number): { startLine: number; endLine: number; content: string } | null {
    // Find the function start by looking backwards for 'function'
    let functionStartIndex = startIndex;
    for (let i = startIndex; i >= 0; i--) {
      const line = lines[i];
      if (!this.isCommentLine(line) && line.includes('function')) {
        functionStartIndex = i;
        break;
      }
    }
    
    // Find the function end by counting braces
    let braceCount = 0;
    let functionEndIndex = functionStartIndex;
    let foundOpenBrace = false;
    
    for (let i = functionStartIndex; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundOpenBrace = true;
        } else if (char === '}') {
          braceCount--;
          if (foundOpenBrace && braceCount === 0) {
            functionEndIndex = i;
            break;
          }
        }
      }
      
      if (foundOpenBrace && braceCount === 0) {
        break;
      }
    }
    
    if (functionEndIndex > functionStartIndex) {
      const functionLines = lines.slice(functionStartIndex, functionEndIndex + 1);
      return {
        startLine: functionStartIndex + 1,
        endLine: functionEndIndex + 1,
        content: functionLines.join('\n')
      };
    }
    
    return null;
  }

  private matchesPattern(text: string, pattern: string): boolean {
    const regex = new RegExp(pattern);
    return regex.test(text);
  }

  private processMatches(matches: SelectMatch[], file: string, options: Record<string, any>): SelectResult[] {
    const fileName = path.basename(file);
    const formatter = this.determineFormatter(options);
    return formatter.format(matches, fileName, file);
  }

  private determineFormatter(options: Record<string, any>): SelectResultFormatter {
    const formatterType = this.getFormatterType(options);
    return this.formatters.get(formatterType)!;
  }

  private getFormatterType(options: Record<string, any>): string {
    const optionChecks = this.createOptionChecks(options);
    const found = optionChecks.find(option => option.check);
    return found ? found.type : 'basic';
  }

  private createOptionChecks(options: Record<string, any>) {
    return [
      { check: this.hasDefinitionOption(options), type: 'definition' },
      { check: this.hasLineOption(options), type: 'line' },
      { check: this.hasPreviewMatchOption(options), type: 'preview' },
      { check: this.hasPreviewOption(options), type: 'preview' }
    ];
  }

  private hasDefinitionOption(options: Record<string, any>): boolean {
    return options.includeDefinition || options['include-definition'];
  }

  private hasLineOption(options: Record<string, any>): boolean {
    return options.includeLine || options['include-line'];
  }

  private hasPreviewOption(options: Record<string, any>): boolean {
    return options.previewLine || options['preview-line'];
  }

  private hasPreviewMatchOption(options: Record<string, any>): boolean {
    return options.previewMatch || options['preview-match'];
  }



  private handleExecutionError(error: unknown): void {
    console.error('Error:', error);
    process.exit(1);
  }

  validateOptions(options: Record<string, any>): void {
    if (options.range) {
      this.validateRangeOptions(options);
    } else if (options.structural) {
      this.validateStructuralOptions(options);
    } else if (!options.regex) {
      throw new Error('--regex must be specified');
    }
  }

  private validateRangeOptions(options: Record<string, any>): void {
    if (!options.startRegex && !options['start-regex']) {
      throw new Error('--start-regex must be specified with --range');
    }
    if (!options.endRegex && !options['end-regex']) {
      throw new Error('--end-regex must be specified with --range');
    }
  }

  private validateStructuralOptions(options: Record<string, any>): void {
    if (!options.regex) {
      throw new Error('--regex must be specified with --structural');
    }
  }

  getHelpText(): string {
    return '\nExamples:\n  refakts select src/file.ts --regex "tempResult"\n  refakts select src/file.ts --regex "calculateTotal" --include-definition\n  refakts select src/file.ts --regex "tempResult" --include-line\n  refakts select src/file.ts --regex "tempResult" --preview-line\n  refakts select src/file.ts --range --start-regex "const.*=" --end-regex "return.*"\n  refakts select src/file.ts --regex "user.*" --boundaries "function"\n  refakts select src/file.ts --structural --regex ".*[Uu]ser.*" --include-methods --include-fields';
  }
}