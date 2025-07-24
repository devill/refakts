import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { QualityBaseline, BASELINE_FILE } from '../../quality-tools/baseline-types';

const getBaselinePath = (): string => {
  return join(process.cwd(), BASELINE_FILE);
};

const readBaselineFile = (baselinePath: string): QualityBaseline => {
  try {
    const content = readFileSync(baselinePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
};

export const loadBaseline = (): QualityBaseline => {
  const baselinePath = getBaselinePath();
  if (!existsSync(baselinePath)) {
    return {};
  }
  
  return readBaselineFile(baselinePath);
};

export const saveBaseline = (baseline: QualityBaseline): void => {
  const baselinePath = getBaselinePath();
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
};