import { QualityCheck, QualityIssue, QualityGroup } from '../quality-tools/quality-check-interface';
import { getIncompleteRefactorings } from '../cli-generator';
import { isCheckSnoozed, clearExpiredSnoozes } from '../quality-tools/snooze-tracker';

export const incompleteRefactoringCheck: QualityCheck = {
  name: 'incompleteRefactoring',
  check: (sourceDir: string): QualityIssue[] => {
    clearExpiredSnoozes();
    const incompleteRefactorings = getIncompleteRefactorings();
    const activelySnoozedRefactorings = filterSnoozedRefactorings(incompleteRefactorings);
    return activelySnoozedRefactorings.length > 0 ? [createIncompleteIssue(activelySnoozedRefactorings)] : [];
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'incompleteRefactoring' ? {
    title: 'INCOMPLETE REFACTORINGS',
    description: 'Incomplete refactorings should be finished or marked complete.',
    actionGuidance: 'Test these refactorings on files outside fixtures and update completion status.'
  } : undefined
};

function filterSnoozedRefactorings(refactorings: string[]): string[] {
  return refactorings.filter(refactoring => !isCheckSnoozed('incompleteRefactoring', refactoring));
}

const createIncompleteIssue = (refactorings: string[]): QualityIssue => ({
  type: 'incompleteRefactoring',
  message: `Consider if any incomplete refactorings should be marked complete: ${refactorings.join(', ')}`
});