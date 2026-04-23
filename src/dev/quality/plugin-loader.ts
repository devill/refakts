import { QualityCheck } from './quality-check-interface';
import { commentCheck } from './checks/comment-check';
import { duplicationCheck } from './checks/duplication-check';
import { unusedMethodCheck } from './checks/unused-method-check';
import { gitDiffCheck } from './checks/git-diff-check';
import { linterCheck } from './checks/linter-check';
import { featureEnvyCheck } from './checks/feature-envy-check';
const allQualityChecks: QualityCheck[] = [
  linterCheck,
  commentCheck,
  duplicationCheck,
  unusedMethodCheck,
  featureEnvyCheck,
  gitDiffCheck
];

export const loadQualityChecks = (): QualityCheck[] => allQualityChecks;
