import { QualityCheck, QualityIssue, QualityGroup } from '../quality-tools/quality-check-interface';
import { getIncompleteRefactorings } from '../cli-generator';

export const incompleteRefactoringCheck: QualityCheck = {
  name: 'incompleteRefactoring',
  check: (sourceDir: string): QualityIssue[] => {
    const incompleteRefactorings = getIncompleteRefactorings();
    return incompleteRefactorings.length > 0 ? [createIncompleteIssue(incompleteRefactorings)] : [];
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'incompleteRefactoring' ? {
    title: 'INCOMPLETE REFACTORINGS',
    description: 'Incomplete refactorings should be finished or marked complete.',
    actionGuidance: 'Test these refactorings on files outside fixtures and update completion status.'
  } : undefined
};

const createIncompleteIssue = (refactorings: string[]): QualityIssue => ({
  type: 'incompleteRefactoring',
  message: `Consider if any incomplete refactorings should be marked complete: ${refactorings.join(', ')}`
});