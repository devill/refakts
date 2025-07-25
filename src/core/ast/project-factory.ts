import { Project } from 'ts-morph';
import { TsConfigFinder } from './tsconfig-finder';

export class ProjectFactory {
  private tsConfigFinder = new TsConfigFinder();

  createForFile(filePath: string): Project {
    const configPath = this.tsConfigFinder.findPreferredConfig(filePath);
    
    if (!configPath) {
      return new Project({});
    }

    return new Project({ tsConfigFilePath: configPath });
  }

  createDefault(): Project {
    return new Project({});
  }
}