import { CommandOptions, RefactoringCommand } from '../command';
import { ConsoleOutput } from '../interfaces/ConsoleOutput';
import { UsageFinderService } from '../services/usage-finder-service';
import { ASTService } from '../services/ast-service';
import { ImportReferenceService } from '../services/import-reference-service';
import * as fs from 'fs';
import * as path from 'path';

export class MoveFileCommand implements RefactoringCommand {
  readonly name = 'move-file';
  readonly description = 'Move a file and update all import references';
  readonly complete = false;
  
  private usageFinderService = new UsageFinderService();
  private astService = new ASTService();
  private importReferenceService = new ImportReferenceService();
  private consoleOutput!: ConsoleOutput;

  async execute(targetLocation: string, _options: CommandOptions): Promise<void> {
    const [sourcePath, destinationPath] = this.parseMoveSyntax(targetLocation);
    
    this.validateDestinationPathFormat(destinationPath);
    
    const resolvedSourcePath = this.resolveSourcePath(sourcePath);
    const resolvedDestinationPath = this.resolveDestinationPath(destinationPath);
    
    this.validateSourceFile(resolvedSourcePath);
    
    if (this.isSameLocation(resolvedSourcePath, resolvedDestinationPath)) {
      this.consoleOutput.write(`File is already at the target location: ${sourcePath}\n`);
      return;
    }
    
    const referencingFiles = await this.findReferencingFiles(resolvedSourcePath);
    await this.validateNoCircularDependencies(resolvedSourcePath, resolvedDestinationPath, referencingFiles);
    
    this.validateDestinationFile(resolvedDestinationPath);
    await this.moveFile(resolvedSourcePath, resolvedDestinationPath);
    await this.updateImportReferences(resolvedSourcePath, resolvedDestinationPath, referencingFiles);
    this.outputSummary(sourcePath, destinationPath, referencingFiles);
  }

  private resolveSourcePath(sourcePath: string): string {
    if (fs.existsSync(sourcePath)) {
      return sourcePath;
    }
    
    const srcPath = path.join('src', sourcePath);
    if (fs.existsSync(srcPath)) {
      return srcPath;
    }
    
    return sourcePath;
  }

  private resolveDestinationPath(destinationPath: string): string {
    if (destinationPath.startsWith('src/')) {
      return destinationPath;
    }
    
    return path.join('src', destinationPath);
  }

  private parseMoveSyntax(targetLocation: string): [string, string] {
    const parts = targetLocation.trim().split(/\s+/);
    if (parts.length !== 2) {
      throw new Error(`move-file requires exactly two arguments: source and destination paths, got: ${targetLocation}`);
    }
    return [parts[0], parts[1]];
  }

  private validateSourceFile(sourcePath: string): void {
    this.ensureFileExists(sourcePath);
    this.ensureFileHasValidSyntax(sourcePath);
  }

  private validateDestinationFile(destinationPath: string): void {
    if (fs.existsSync(destinationPath)) {
      throw new Error(`Cannot move file to ${destinationPath} - file already exists`);
    }
  }

  private validateDestinationPathFormat(destinationPath: string): void {
    if (destinationPath.includes('../..') || destinationPath.startsWith('./../../')) {
      throw new Error(`Invalid destination path: ${destinationPath}`);
    }
  }

  private isSameLocation(sourcePath: string, destinationPath: string): boolean {
    return path.resolve(sourcePath) === path.resolve(destinationPath);
  }

  private ensureFileExists(sourcePath: string): void {
    if (!fs.existsSync(sourcePath)) {
      const srcPath = path.join('src', sourcePath);
      if (fs.existsSync(srcPath)) {
        throw new Error(`Source file does not exist: ${sourcePath}. Did you mean: ${srcPath}?`);
      }
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
  }

  private ensureFileHasValidSyntax(sourcePath: string): void {
    try {
      const sourceFile = this.astService.loadSourceFile(sourcePath);
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      if (diagnostics.length > 0) {
        process.stdout.write(`Warning: Syntax errors detected in ${sourcePath}\n`);
      }
    } catch {
      process.stdout.write(`Warning: Syntax errors detected in ${sourcePath}\n`);
    }
  }

  private async findReferencingFiles(sourcePath: string): Promise<string[]> {
    return await this.importReferenceService.findReferencingFiles(sourcePath);
  }

  private async validateNoCircularDependencies(sourcePath: string, destinationPath: string, referencingFiles: string[]): Promise<void> {
    for (const referencingFile of referencingFiles) {
      if (this.wouldCreateCircularDependency(sourcePath, destinationPath, referencingFile)) {
        throw new Error(`Moving ${sourcePath} to ${destinationPath} would create circular dependency with ${referencingFile}`);
      }
    }
  }

  private wouldCreateCircularDependency(sourcePath: string, destinationPath: string, referencingFile: string): boolean {
    const destinationDir = path.dirname(destinationPath);
    const referencingDir = path.dirname(referencingFile);
    
    if (destinationDir === referencingDir) {
      return this.fileImportsFrom(sourcePath, referencingFile);
    }
    
    return false;
  }

  private fileImportsFrom(sourcePath: string, targetPath: string): boolean {
    try {
      const sourceFile = this.astService.loadSourceFile(sourcePath);
      const imports = sourceFile.getImportDeclarations();
      
      return imports.some(importDeclaration => {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
        const resolvedPath = this.resolveImportPath(sourcePath, moduleSpecifier);
        const targetPathWithoutExtension = targetPath.replace(/\.ts$/, '');
        const absoluteTargetPath = path.resolve(targetPathWithoutExtension);
        
        return resolvedPath === targetPathWithoutExtension || resolvedPath === absoluteTargetPath;
      });
    } catch {
      return false;
    }
  }

  private resolveImportPath(fromFile: string, importPath: string): string {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, importPath);
    }
    return importPath;
  }


  private async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    this.ensureDestinationDirectoryExists(destinationPath);
    await this.performFileMove(sourcePath, destinationPath);
  }

  private ensureDestinationDirectoryExists(destinationPath: string): void {
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
  }

  private async performFileMove(sourcePath: string, destinationPath: string): Promise<void> {
    const shouldUseGitMv = await this.shouldUseGitMv(sourcePath);
    
    if (shouldUseGitMv) {
      await this.gitMoveFile(sourcePath, destinationPath);
    } else {
      fs.renameSync(sourcePath, destinationPath);
    }
  }

  private async shouldUseGitMv(sourcePath: string): Promise<boolean> {
    if (!this.isInGitRepository()) {
      return false;
    }
    
    if (this.isTestFile(sourcePath)) {
      return false;
    }
    
    return this.isFileTrackedByGit(sourcePath);
  }

  private isInGitRepository(): boolean {
    try {
      const { execSync } = require('child_process');
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private isTestFile(sourcePath: string): boolean {
    return sourcePath.includes('fixture') || sourcePath.includes('received');
  }

  private isFileTrackedByGit(sourcePath: string): boolean {
    try {
      const { execSync } = require('child_process');
      execSync(`git ls-files --error-unmatch "${sourcePath}"`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private async gitMoveFile(sourcePath: string, destinationPath: string): Promise<void> {
    const { execSync } = require('child_process');
    try {
      execSync(`git mv "${sourcePath}" "${destinationPath}"`, { stdio: 'inherit' });
    } catch {
      fs.renameSync(sourcePath, destinationPath);
    }
  }

  private async updateImportReferences(sourcePath: string, destinationPath: string, referencingFiles: string[]): Promise<void> {
    await this.importReferenceService.updateImportReferences(sourcePath, destinationPath, referencingFiles);
  }


  private outputSummary(sourcePath: string, destinationPath: string, referencingFiles: string[]): void {
    this.consoleOutput.write(`File moved: ${sourcePath} → ${destinationPath}\n`);
    if (referencingFiles.length > 0) {
      this.consoleOutput.write('Updated imports in:\n');
      referencingFiles.forEach(file => {
        const relativePath = this.getRelativePath(file);
        this.consoleOutput.write(`  - ${relativePath}\n`);
      });
    } else {
      this.consoleOutput.write('No import references found to update\n');
    }
  }

  private getRelativePath(filePath: string): string {
    const cwd = process.cwd();
    const relativePath = path.relative(cwd, filePath);
    return relativePath;
  }

  validateOptions(_options: CommandOptions): void {
  }

  getHelpText(): string {
    try {
      const helpFilePath = path.join(__dirname, 'move-file.help.txt');
      return '\n' + fs.readFileSync(helpFilePath, 'utf8');
    } catch {
      return '\nHelp file not found';
    }
  }

  setConsoleOutput(consoleOutput: ConsoleOutput): void {
    this.consoleOutput = consoleOutput;
  }
}