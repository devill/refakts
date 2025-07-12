import * as path from 'path';
import { Project } from 'ts-morph';

export class FileSystemHelper {
  constructor(private project: Project) {}

  loadProjectFiles(filePath: string): void {
    const projectDir = this.findProjectRoot(filePath);
    this.loadAllFilesInDirectory(projectDir);
  }

  findProjectRoot(filePath: string): string {
    let currentDir = path.dirname(path.resolve(filePath));
    let foundRoot = null;

    const cwd = process.cwd();
    
    while (currentDir !== path.dirname(currentDir) && (currentDir === cwd || currentDir.startsWith(cwd))) {
      const tsConfigPath = path.join(currentDir, 'tsconfig.json');
      if (require('fs').existsSync(tsConfigPath)) {
        foundRoot = currentDir;
        break;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return foundRoot || path.dirname(path.resolve(filePath));
  }

  loadAllFilesInDirectory(dir: string): void {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
        this.loadAllFilesInDirectory(fullPath);
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        try {
          this.project.addSourceFileAtPath(fullPath);
        } catch {
          continue;
        }
      }
    }
  }
}