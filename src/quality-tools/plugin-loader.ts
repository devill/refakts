import { QualityCheck } from './quality-check-interface';
import { commentCheck } from '../quality-checks/comment-check';
import { fileSizeCheck } from '../quality-checks/file-size-check';
import { functionSizeCheck } from '../quality-checks/function-size-check';
import { duplicationCheck } from '../quality-checks/duplication-check';
import { unusedMethodCheck } from '../quality-checks/unused-method-check';
import { incompleteRefactoringCheck } from '../quality-checks/incomplete-refactoring-check';
import { complexityCheck } from '../quality-checks/complexity-check';
import { gitDiffCheck } from '../quality-checks/git-diff-check';
import { changeFrequencyCheck } from '../quality-checks/change-frequency-check';

export const loadQualityChecks = (): QualityCheck[] => [
  commentCheck,
  fileSizeCheck,
  functionSizeCheck,
  duplicationCheck,
  unusedMethodCheck,
  incompleteRefactoringCheck,
  complexityCheck,
  gitDiffCheck,
  changeFrequencyCheck
];

