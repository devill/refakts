import * as fs from 'fs';
import * as path from 'path';
import {exec, execSync} from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FileSystemWrapper {
  existsSync(_filePath: string): boolean;
  mkdirSync(_dirPath: string, _options?: { recursive?: boolean }): void;
  renameSync(_sourcePath: string, _destPath: string): void;
}

export class RealFileSystemWrapper implements FileSystemWrapper {
  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  mkdirSync(dirPath: string, options?: { recursive?: boolean }): void {
    fs.mkdirSync(dirPath, options);
  }

  renameSync(sourcePath: string, destPath: string): void {
    fs.renameSync(sourcePath, destPath);
  }
}

export class FileMover {
  constructor(private _fileSystem: FileSystemWrapper) {}

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    this.ensureDestinationDirectoryExists(destinationPath);
    await this.performFileMove(sourcePath, destinationPath);
  }

  private ensureDestinationDirectoryExists(destinationPath: string): void {
    const destinationDir = path.dirname(destinationPath);
    if (!this._fileSystem.existsSync(destinationDir)) {
      this._fileSystem.mkdirSync(destinationDir, { recursive: true });
    }
  }

  private async performFileMove(sourcePath: string, destinationPath: string): Promise<void> {
    if (await this.shouldUseGitMv(sourcePath)) {
      await this.gitMoveFile(sourcePath, destinationPath);
    } else {
      this._fileSystem.renameSync(sourcePath, destinationPath);
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
      return this._fileSystem.existsSync(gitDir);
    } catch {
      return false;
    }
  }

  private isTestFile(sourcePath: string): boolean {
    return sourcePath.includes('test') || sourcePath.includes('spec');
  }

  private isFileTrackedByGit(sourcePath: string): boolean {
    try {
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
      this._fileSystem.renameSync(sourcePath, destinationPath);
    }
  }
}