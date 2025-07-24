export interface FileBaseline {
  lastCommitId: string;
  violations: string[];
}

export interface QualityBaseline {
  [filePath: string]: FileBaseline;
}

export const BASELINE_FILE = '.quality-baseline.json';