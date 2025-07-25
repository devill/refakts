export const MOCK_QUALITY_CHECKS = [
  {
    name: 'comments',
    getGroupDefinition: (key: string) => {
      if (key === 'comments') return { title: 'COMMENTS DETECTED', description: 'Comments indicate code that is not self-documenting.' };
      return undefined;
    }
  },
  {
    name: 'complexity',
    getGroupDefinition: (key: string) => {
      if (key === 'complexity') return { title: 'HIGH COMPLEXITY', description: 'Complex functions are harder to understand, test, and maintain.' };
      if (key === 'criticalComplexity') return { title: 'CRITICAL: OVERSIZED FUNCTIONS', description: 'Functions over 10 lines violate single responsibility principle.' };
      return undefined;
    }
  },
  {
    name: 'duplication',
    getGroupDefinition: (key: string) => {
      if (key === 'duplication') return { title: 'CODE DUPLICATION', description: 'Duplicated code increases maintenance burden and error risk.' };
      return undefined;
    }
  }
];

export const EMPTY_QUALITY_CHECKS: Array<{ name: string; getGroupDefinition?: (key: string) => { title: string; description: string } | undefined }> = [];

export const BROKEN_QUALITY_CHECK = [
  {
    name: 'broken',
    getGroupDefinition: (_key: string) => {
      throw new Error('Broken quality check');
    }
  }
];

export const NO_GROUP_DEFINITIONS = [
  {
    name: 'nogroups'
  }
];