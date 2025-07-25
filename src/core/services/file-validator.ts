import { ASTService } from '../ast/ast-service';
import { SourceFile, Diagnostic } from 'ts-morph';
import * as path from 'path';

export interface FileSystemWrapper {
  existsSync(_filePath: string): boolean;
}

export class FileValidator {
  constructor(
    private _astService: ASTService,
    private _fileSystem: FileSystemWrapper
  ) {}

  validateSourceFile(sourcePath: string): void {
    this.ensureFileExists(sourcePath);
    this.ensureFileHasValidSyntax(sourcePath);
  }

  validateDestinationFile(destinationPath: string): void {
    if (this._fileSystem.existsSync(destinationPath)) {
      const relativePath = path.relative(process.cwd(), destinationPath);
      throw new Error(`Cannot move file to ${relativePath} - file already exists`);
    }
  }

  private ensureFileExists(sourcePath: string): void {
    if (!this._fileSystem.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
  }

  private ensureFileHasValidSyntax(sourcePath: string): void {
    try {
      const errors = this.getSyntaxErrors(sourcePath);
      if (errors.length > 0) {
        const relativePath = path.relative(process.cwd(), sourcePath);
        const errorDetails = errors.map(error => `  - ${error}`).join('\n');
        throw new Error(`Syntax errors detected in ${relativePath}:\n${errorDetails}`);
      }
    } catch (error: unknown) {
      this.handleSyntaxValidationError(error, sourcePath);
    }
  }

  private handleSyntaxValidationError(error: unknown, sourcePath: string): void {
    const errorWithMessage = error as { message?: string };
    if (errorWithMessage.message?.includes('Permission denied') || errorWithMessage.message?.includes('Cannot read file')) {
      throw error;
    }
    if (errorWithMessage.message?.includes('Syntax errors detected')) {
      throw error;
    }
    throw new Error(`Cannot validate syntax of ${sourcePath}: ${errorWithMessage.message || 'Unknown error'}`);
  }

  private getSyntaxErrors(sourcePath: string): string[] {
    const seriousErrors = this.collectErrors(this._astService.loadSourceFile(sourcePath));
    return seriousErrors.map(diagnostic => this.formatDiagnostic(diagnostic));
  }

  private formatDiagnostic(diagnostic: Diagnostic): string {
    const messageStr = this.extractMessageText(diagnostic);
    const locationPrefix = this.formatLocationPrefix(diagnostic);
    return locationPrefix ? `${locationPrefix}: ${messageStr}` : messageStr;
  }

  private extractMessageText(diagnostic: Diagnostic): string {
    const message = diagnostic.getMessageText();
    return typeof message === 'string' ? message : message.getMessageText();
  }

  private formatLocationPrefix(diagnostic: Diagnostic): string | undefined {
    const start = diagnostic.getStart ? diagnostic.getStart() : undefined;
    if (start === undefined) return undefined;
    
    const sourceFile = diagnostic.getSourceFile ? diagnostic.getSourceFile() : undefined;
    if (!sourceFile) return undefined;
    
    const lineAndChar = sourceFile.getLineAndColumnAtPos(start);
    return `Line ${lineAndChar.line + 1}, Column ${lineAndChar.column + 1}`;
  }

  private collectErrors(sourceFile: SourceFile) {
    return sourceFile.getPreEmitDiagnostics().filter(diagnostic => {
      const message = diagnostic.getMessageText();
      const messageStr = typeof message === 'string' ? message : message.getMessageText();
      return !messageStr.includes('Cannot find module') &&
          !messageStr.includes('Could not find a declaration file for module') &&
          !messageStr.includes('Invalid module name in augmentation') &&
          !messageStr.includes('Cannot find name \'console\'');
    });
  }
}