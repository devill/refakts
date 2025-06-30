import { QualityIssue, QualityGroup } from './quality-check-interface';

export const formatIssue = (issue: QualityIssue): string => 
  issue.file && issue.line 
    ? `${issue.file}:${issue.line} - ${issue.message}`
    : issue.message;

export const groupByType = (issues: QualityIssue[]): Map<string, QualityIssue[]> =>
  issues.reduce((groups, issue) => {
    const key = getGroupKey(issue);
    return groups.set(key, [...(groups.get(key) || []), issue]);
  }, new Map<string, QualityIssue[]>());

export const createGroup = (type: string, issues: QualityIssue[]): QualityGroup => ({
  ...getGroupDefinition(type),
  violations: issues.map(formatIssue)
});

const getGroupKey = (issue: QualityIssue): string => {
  if (issue.type === 'fileSize') return issue.severity === 'critical' ? 'criticalFiles' : 'largeFiles';
  if (issue.type === 'functionSize') return issue.severity === 'critical' ? 'criticalFunctions' : 'largeFunctions';
  return issue.type;
};

const getGroupDefinition = (type: string): Omit<QualityGroup, 'violations'> => 
  groupDefinitions[type] || defaultGroup;

const groupDefinitions: Record<string, Omit<QualityGroup, 'violations'>> = {
  comment: {
    title: 'COMMENTS DETECTED',
    description: 'Comments indicate code that is not self-documenting.',
    actionGuidance: '👧🏻💬 Extract complex logic into well-named functions instead of explaining with comments. Remove ALL comments unless they impact functionality.'
  },
  criticalFiles: {
    title: 'CRITICAL: OVERSIZED FILES',
    description: 'Files over 300 lines are extremely difficult to maintain.',
    actionGuidance: '👧🏻💬 CRITICAL: Split these files into smaller, focused modules immediately.'
  },
  largeFiles: {
    title: 'LARGE FILES',
    description: 'Large files are harder to understand and maintain.',
    actionGuidance: '👧🏻💬 Break these files into smaller, focused modules with single responsibilities.'
  },
  criticalFunctions: {
    title: 'CRITICAL: OVERSIZED FUNCTIONS',
    description: 'Functions over 10 lines violate single responsibility principle.',
    actionGuidance: '👧🏻💬 CRITICAL: Break down these functions immediately. Long functions may indicate an opportunity to introduce a new class.'
  },
  largeFunctions: {
    title: 'LARGE FUNCTIONS',
    description: 'Functions approaching size limits should be refactored.',
    actionGuidance: '👧🏻💬 Consider extracting helper methods to improve readability.'
  },
  duplication: {
    title: 'CODE DUPLICATION',
    description: 'Duplicated code increases maintenance burden and error risk.',
    actionGuidance: '👧🏻💬 Extract common functionality into shared functions or classes.'
  },
  unusedMethod: {
    title: 'UNUSED CODE',
    description: 'Dead code reduces codebase clarity and increases maintenance burden.',
    actionGuidance: '👧🏻💬 Remove these unused methods to maintain codebase clarity.'
  },
  incompleteRefactoring: {
    title: 'INCOMPLETE REFACTORINGS',
    description: 'Incomplete refactorings should be finished or marked complete.',
    actionGuidance: '👧🏻💬 Test these refactorings on files outside fixtures and update completion status.'
  },
  complexity: {
    title: 'HIGH COMPLEXITY',
    description: 'Complex functions are harder to understand, test, and maintain.',
    actionGuidance: '👧🏻💬 Break down complex functions into smaller, single-purpose methods.'
  },
  diffSize: {
    title: 'LARGE CHANGES',
    description: 'Large diffs are harder to review and more likely to introduce bugs.',
    actionGuidance: '👧🏻💬 Commit smaller incremental changes with passing tests to maintain code quality.'
  },
  changeFrequency: {
    title: 'OPEN-CLOSED PRINCIPLE VIOLATIONS',
    description: 'Files changing frequently suggest design should be extensible without modification.',
    actionGuidance: '👧🏻💬 Consider introducing abstractions, dependency injection, or plugin patterns to improve the design. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
    requiresUserConsultation: true
  },
  cohesiveChange: {
    title: 'ABSTRACTION LEAKAGE',
    description: 'Files changing together suggest concerns not properly encapsulated.',
    actionGuidance: '👧🏻💬 Consider extracting shared abstractions or reducing coupling. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
    requiresUserConsultation: true
  }
};

const defaultGroup: Omit<QualityGroup, 'violations'> = {
  title: 'OTHER ISSUES',
  description: 'Miscellaneous quality issues detected.',
  actionGuidance: '👧🏻💬 Address these issues as appropriate.'
};