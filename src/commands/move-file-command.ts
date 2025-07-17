import { CommandOptions, RefactoringCommand } from '../command';
import { UsageFinderService } from '../services/usage-finder-service';
import { ASTService } from '../services/ast-service';
import { LocationRange } from '../core/location-range';
import * as fs from 'fs';
import * as path from 'path';

export class MoveFileCommand implements RefactoringCommand {
  readonly name = 'move-file';
  readonly description = 'Move a file and update all import references';
  readonly complete = false;
  
  private usageFinderService = new UsageFinderService();
  private astService = new ASTService();

  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    const [sourcePath, destinationPath] = this.parseArguments(targetLocation);
    
    // 1. Validate source file exists and has no syntax issues
    this.validateSourceFile(sourcePath);
    
    // 2. Find all files that reference this file
    const referencingFiles = await this.findReferencingFiles(sourcePath);
    
    // 3. Move the file
    await this.moveFile(sourcePath, destinationPath);
    
    // 4. Update all import references
    await this.updateImportReferences(sourcePath, destinationPath, referencingFiles);
    
    // 5. Output summary
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
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
    
    // Check for syntax issues
    try {
      const sourceFile = this.astService.loadSourceFile(sourcePath);
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      if (diagnostics.length > 0) {
        throw new Error(`Source file has syntax errors: ${sourcePath}`);
      }
    } catch (error) {
      throw new Error(`Unable to parse source file: ${sourcePath}`);
    }
  }

  private async findReferencingFiles(sourcePath: string): Promise<string[]> {
    // We need to find all files that import from this file
    // For now, let's return an empty array and implement this step by step
    // TODO: Use UsageFinderService to find all import references
    return [];
  }

  private async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    // Create destination directory if it doesn't exist
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    
    // Check if this is a git repository and use git mv if appropriate
    const shouldUseGitMv = await this.shouldUseGitMv(sourcePath);
    
    if (shouldUseGitMv) {
      await this.gitMoveFile(sourcePath, destinationPath);
    } else {
      fs.renameSync(sourcePath, destinationPath);
    }
  }

  private async shouldUseGitMv(sourcePath: string): Promise<boolean> {
    // Check if we're in a git repository
    try {
      const { execSync } = require('child_process');
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      
      // Check if the file is not ignored by git
      // For fixture tests, we want to avoid git mv to prevent issues
      if (sourcePath.includes('fixture') || sourcePath.includes('received')) {
        return false;
      }
      
      // Check if file is tracked by git
      try {
        execSync(`git ls-files --error-unmatch "${sourcePath}"`, { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  private async gitMoveFile(sourcePath: string, destinationPath: string): Promise<void> {
    const { execSync } = require('child_process');
    try {
      execSync(`git mv "${sourcePath}" "${destinationPath}"`, { stdio: 'inherit' });
    } catch (error) {
      // If git mv fails, fall back to regular file move
      fs.renameSync(sourcePath, destinationPath);
    }
  }

  private async updateImportReferences(sourcePath: string, destinationPath: string, referencingFiles: string[]): Promise<void> {
    // TODO: Implement import reference updates
  }

  private outputSummary(sourcePath: string, destinationPath: string, referencingFiles: string[]): void {
    console.log(`File moved: ${sourcePath} → ${destinationPath}`);
    if (referencingFiles.length > 0) {
      console.log('Updated imports in:');
      referencingFiles.forEach(file => console.log(`  - ${file}`));
    }
  }

  validateOptions(options: CommandOptions): void {
    // Move file command doesn't use options in the same way as other commands
    // Validation is done in parseArguments during execute
  }

  getHelpText(): string {
    return `
Move a file and update all import references

Usage:
  refakts move-file "source destination"

Arguments:
  source destination    Source and destination paths separated by space

Examples:
  refakts move-file "src/utils/math.ts src/helpers/math.ts"
  refakts move-file "components/Button.tsx ui/Button.tsx"
`;
  }
}