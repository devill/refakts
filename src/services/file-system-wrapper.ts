import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FileSystemWrapper {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  renameSync(oldPath: string, newPath: string): void;
}

export class RealFileSystemWrapper implements FileSystemWrapper {
  existsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  mkdirSync(path: string, options?: { recursive?: boolean }): void {
    fs.mkdirSync(path, options);
  }

  renameSync(oldPath: string, newPath: string): void {
    fs.renameSync(oldPath, newPath);
  }
}

export class FileMover {
  constructor(private fileSystem: FileSystemWrapper) {}

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    this.ensureDestinationDirectoryExists(destinationPath);
    await this.performFileMove(sourcePath, destinationPath);
  }

  private ensureDestinationDirectoryExists(destinationPath: string): void {
    const destinationDir = path.dirname(destinationPath);
    if (!this.fileSystem.existsSync(destinationDir)) {
      this.fileSystem.mkdirSync(destinationDir, { recursive: true });
    }
  }

  private async performFileMove(sourcePath: string, destinationPath: string): Promise<void> {
    if (await this.shouldUseGitMv(sourcePath)) {
      await this.gitMoveFile(sourcePath, destinationPath);
    } else {
      this.fileSystem.renameSync(sourcePath, destinationPath);
    }
  }

  private async shouldUseGitMv(sourcePath: string): Promise<boolean> {
    return this.isInGitRepository() && 
           !this.isTestFile(sourcePath) && 
           this.isFileTrackedByGit(sourcePath);
  }

  private isInGitRepository(): boolean {
    try {
      const gitDir = path.join(process.cwd(), '.git');
      return this.fileSystem.existsSync(gitDir);
    } catch {
      return false;
    }
  }

  private isTestFile(sourcePath: string): boolean {
    return sourcePath.includes('test') || sourcePath.includes('spec');
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
    try {
      await execAsync(`git mv "${sourcePath}" "${destinationPath}"`);
    } catch {
      this.fileSystem.renameSync(sourcePath, destinationPath);
    }
  }
}