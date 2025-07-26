import * as ts from 'typescript';
import * as path from 'path';

import {existsSync} from "fs";

export class TsConfigFinder {
  findPreferredConfig(filePath: string): string | undefined {
    const tsConfigPath = this.findTsConfig(filePath);
    if (!tsConfigPath) {
      return undefined;
    }
    
    return this.preferEslintConfig(tsConfigPath);
  }

  private findTsConfig(filePath: string): string | undefined {
    return ts.findConfigFile(
      path.dirname(path.resolve(filePath)),
      ts.sys.fileExists,
      'tsconfig.json'
    );
  }

  private preferEslintConfig(tsConfigPath: string): string {
    const configDir = path.dirname(tsConfigPath);
    const eslintConfigPath = path.join(configDir, 'tsconfig.eslint.json');
    
    if (existsSync(eslintConfigPath)) {
      return eslintConfigPath;
    }
    
    return tsConfigPath;
  }
}