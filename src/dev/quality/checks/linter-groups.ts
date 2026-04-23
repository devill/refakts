import { QualityGroup } from '../quality-check-interface';

type GroupDef = Omit<QualityGroup, 'violations'>;

const linterViolationGroup: GroupDef = {
  title: 'ESLint Violations',
  description: 'Code style and potential bug issues detected by ESLint',
  actionGuidance: 'Run `npm run lint:fix` to automatically fix many of these issues. Manual fixes may be needed for logical errors.',
  requiresUserConsultation: false
};

const linterErrorGroup: GroupDef = {
  title: 'Linter Execution Errors',
  description: 'Issues with running the linter itself',
  actionGuidance: 'Check ESLint configuration and ensure all dependencies are installed.',
  requiresUserConsultation: true
};

const fileSizeGroup: GroupDef = {
  title: 'CRITICAL: OVERSIZED FILES',
  description: 'Files over 200 lines are extremely difficult to maintain.',
  actionGuidance: 'CRITICAL: Split these files into smaller, focused modules immediately.'
};

const functionSizeGroup: GroupDef = {
  title: 'CRITICAL: OVERSIZED FUNCTIONS',
  description: 'Functions over 12 lines violate single responsibility principle.',
  actionGuidance: 'CRITICAL: Analyze responsibilities first - what distinct concerns does this function handle? Consider: (1) Are these separate responsibilities that belong in different methods? (2) Should this become a class with multiple methods? (3) Can you group cohesive data into objects to reduce local variables? Avoid mechanical extraction - find true responsibility boundaries. If the code has many misplaced responsibilities you may need to first inline methods to see the whole picture and find a better way of redistributing functionality. Think of this when reducing line count seems particularly hard. Taking a step backwards may open up new, better possibilities.'
};

const cyclomaticComplexityGroup: GroupDef = {
  title: 'HIGH CYCLOMATIC COMPLEXITY',
  description: 'Complex functions are harder to understand, test, and maintain.',
  actionGuidance: 'High complexity often indicates multiple responsibilities. Look for: (1) Decision trees that could be strategy patterns, (2) Multiple concerns that belong in separate methods, (3) State machines that could be explicit classes. Focus on extracting meaningful abstractions, not just reducing complexity metrics. If the code has many misplaced responsibilities you may need to first inline methods to see the whole picture and find a better way of redistributing functionality. Think of this when reducing complexity seems particularly hard. Taking a step backwards may open up new, better possibilities.'
};

const manyParametersGroup: GroupDef = {
  title: 'TOO MANY PARAMETERS',
  description: 'Functions with many parameters violate single responsibility principle.',
  actionGuidance: 'Before grouping parameters: (1) Should this method actually belong ON the parameter object as a class method? (2) For static methods with many parameters - this is often a class waiting to happen. (3) Group cohesive data into meaningful objects and pass those around, even if some methods don\'t need every field. Favor declarative style over many locals.'
};

const requireStatementsGroup: GroupDef = {
  title: 'REQUIRE() STATEMENTS DETECTED',
  description: 'CommonJS require() statements should be replaced with ES6 import statements.',
  actionGuidance: 'Replace require() with import statements and ensure all imports are at the top of the file.'
};

const GROUPS: Record<string, GroupDef> = {
  'linter-violation': linterViolationGroup,
  'linter-error': linterErrorGroup,
  'criticalFiles': fileSizeGroup,
  'criticalFunctions': functionSizeGroup,
  'cyclomaticComplexity': cyclomaticComplexityGroup,
  'manyParameters': manyParametersGroup,
  'requireStatements': requireStatementsGroup
};

export function getLinterGroupDefinition(groupKey: string): GroupDef | undefined {
  return GROUPS[groupKey];
}
