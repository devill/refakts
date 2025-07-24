import { QualityCheck } from '../../quality-tools/quality-check-interface';
import { commentCheck } from '../../quality-tools/checks/comment-check';
import { fileSizeCheck } from '../../quality-tools/checks/file-size-check';
import { functionSizeCheck } from '../../quality-tools/checks/function-size-check';
import { duplicationCheck } from '../../quality-tools/checks/duplication-check';
import { unusedMethodCheck } from '../../quality-tools/checks/unused-method-check';
import { complexityCheck } from '../../quality-tools/checks/complexity-check';
import { gitDiffCheck } from '../../quality-tools/checks/git-diff-check';
import { changeFrequencyCheck } from '../../quality-tools/checks/change-frequency-check';
import { linterCheck } from '../../quality-tools/checks/linter-check';
import { featureEnvyCheck } from '../../quality-tools/checks/feature-envy-check';
export const loadQualityChecks = (): QualityCheck[] => [
  linterCheck,
  commentCheck,
  fileSizeCheck,
  functionSizeCheck,
  duplicationCheck,
  unusedMethodCheck,
  complexityCheck,
  featureEnvyCheck,
  gitDiffCheck,
  changeFrequencyCheck
];

