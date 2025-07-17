import { CommandOptions, RefactoringCommand } from '../command';
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

  async execute(targetLocation: string, _options: CommandOptions): Promise<void> {
    const [sourcePath, destinationPath] = this.parseArguments(targetLocation);
    
    this.validateSourceFile(sourcePath);
    const referencingFiles = await this.findReferencingFiles(sourcePath);
    await this.moveFile(sourcePath, destinationPath);
    await this.updateImportReferences(sourcePath, destinationPath, referencingFiles);
    this.outputSummary(sourcePath, destinationPath, referencingFiles);
  }

  private parseArguments(targetLocation: string): [string, string] {
    const parts = targetLocation.trim().split(/\s+/);
    if (parts.length !== 2) {
      throw new Error('move-file requires exactly two arguments: source and destination paths.\nUsage: move-file "source.ts destination.ts"');
    }
    return [parts[0], parts[1]];
  }

  private validateSourceFile(sourcePath: string): void {
    this.ensureFileExists(sourcePath);
    this.ensureFileHasValidSyntax(sourcePath);
  }

  private ensureFileExists(sourcePath: string): void {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
  }

  private ensureFileHasValidSyntax(sourcePath: string): void {
    try {
      const sourceFile = this.astService.loadSourceFile(sourcePath);
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      if (diagnostics.length > 0) {
        throw new Error(`Source file has syntax errors: ${sourcePath}`);
      }
    } catch {
      throw new Error(`Unable to parse source file: ${sourcePath}`);
    }
  }

  private async findReferencingFiles(sourcePath: string): Promise<string[]> {
    return await this.importReferenceService.findReferencingFiles(sourcePath);
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
    // eslint-disable-next-line no-console
    console.log(`File moved: ${sourcePath} → ${destinationPath}`);
    if (referencingFiles.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Updated imports in:');
      // eslint-disable-next-line no-console
      referencingFiles.forEach(file => console.log(`  - ${file}`));
    }
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
}