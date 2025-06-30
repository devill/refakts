import { QualityCheck, QualityIssue } from '../quality-tools/quality-check-interface';
import { getIncompleteRefactorings } from '../cli-generator';

export const incompleteRefactoringCheck: QualityCheck = {
  name: 'incompleteRefactoring',
  check: (sourceDir: string): QualityIssue[] => {
    const incompleteRefactorings = getIncompleteRefactorings();
    return incompleteRefactorings.length > 0 ? [createIncompleteIssue(incompleteRefactorings)] : [];
  }
};

const createIncompleteIssue = (refactorings: string[]): QualityIssue => ({
  type: 'incompleteRefactoring',
  message: `Consider if any incomplete refactorings should be marked complete: ${refactorings.join(', ')}`
});