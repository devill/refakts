interface QualityGroup {
  title: string;
  description: string;
  actionGuidance: string;
  requiresUserConsultation?: boolean;
  violations: string[];
}

export interface QualityIssue {
  type: 'comment' | 'fileSize' | 'functionSize' | 'unusedMethod' | 'duplication' | 'complexity' | 'diffSize' | 'changeFrequency' | 'cohesiveChange' | 'incompleteRefactoring';
  severity?: 'critical' | 'warning' | 'warn';
  message: string;
  data?: any;
}

export class QualityReporter {
  private groups = new Map<string, QualityGroup>();

  addIssue(issue: QualityIssue): void {
    const groupKey = this.getGroupKey(issue);
    
    if (!this.groups.has(groupKey)) {
      this.groups.set(groupKey, this.createGroup(issue));
    }
    
    const group = this.groups.get(groupKey)!;
    group.violations.push(this.formatViolation(issue));
  }

  generateReport(): string {
    if (this.groups.size === 0) {
      return '✅ All quality checks passed';
    }

    return this.buildQualityReport();
  }

  private buildQualityReport(): string {
    const sections = ['❌ Quality issues detected:'];
    this.addGroupSections(sections);
    return sections.join('\n\n');
  }

  private addGroupSections(sections: string[]): void {
    for (const group of this.groups.values()) {
      if (group.violations.length > 0) {
        sections.push(this.formatGroup(group));
      }
    }
  }

  private getGroupKey(issue: QualityIssue): string {
    const sizeGroupKey = this.getSizeGroupKey(issue);
    if (sizeGroupKey) return sizeGroupKey;
    
    return this.getBasicGroupKey(issue);
  }

  private getSizeGroupKey(issue: QualityIssue): string | null {
    if (issue.type === 'fileSize') {
      return issue.severity === 'critical' ? 'criticalFiles' : 'largeFiles';
    }
    
    if (issue.type === 'functionSize') {
      return issue.severity === 'critical' ? 'criticalFunctions' : 'largeFunctions';
    }

    return null;
  }

  private getBasicGroupKey(issue: QualityIssue): string {
    const keyMap = {
      'comment': 'comments',
      'unusedMethod': 'unusedMethods',
      'duplication': 'duplication',
      'complexity': 'complexity',
      'diffSize': 'diffSize',
      'changeFrequency': 'changeFrequency',
      'cohesiveChange': 'cohesiveChange',
      'incompleteRefactoring': 'incompleteRefactoring'
    };

    return keyMap[issue.type as keyof typeof keyMap] || 'other';
  }

  private createGroup(issue: QualityIssue): QualityGroup {
    const groupKey = this.getGroupKey(issue);
    return this.getGroupDefinition(groupKey);
  }

  private getGroupDefinition(groupKey: string): QualityGroup {
    const groupCreators = this.createGroupCreatorsMap();
    const creator = groupCreators[groupKey as keyof typeof groupCreators];
    return creator ? creator() : this.createDefaultGroup();
  }

  private createGroupCreatorsMap() {
    return {
      'comments': () => this.createCommentsGroup(),
      'criticalFiles': () => this.createCriticalFilesGroup(),
      'largeFiles': () => this.createLargeFilesGroup(),
      'criticalFunctions': () => this.createCriticalFunctionsGroup(),
      'largeFunctions': () => this.createLargeFunctionsGroup(),
      'unusedMethods': () => this.createUnusedMethodsGroup(),
      'duplication': () => this.createDuplicationGroup(),
      'complexity': () => this.createComplexityGroup(),
      'diffSize': () => this.createDiffSizeGroup(),
      'changeFrequency': () => this.createChangeFrequencyGroup(),
      'cohesiveChange': () => this.createCohesiveChangeGroup(),
      'incompleteRefactoring': () => this.createIncompleteRefactoringGroup()
    };
  }

  private formatViolation(issue: QualityIssue): string {
    return issue.message;
  }

  private formatGroup(group: QualityGroup): string {
    const headerLines = this.buildGroupHeader(group);
    const violationLines = this.buildViolationList(group.violations);
    return [...headerLines, ...violationLines].join('\n');
  }

  private buildGroupHeader(group: QualityGroup): string[] {
    return [
      `**${group.title}**`,
      group.description,
      group.actionGuidance,
      'Violations:'
    ];
  }

  private buildViolationList(violations: string[]): string[] {
    return violations.map(violation => `- ${violation}`);
  }

  private createCommentsGroup(): QualityGroup {
    return {
      title: 'COMMENTS DETECTED',
      description: 'Comments indicate code that is not self-documenting.',
      actionGuidance: '👧🏻💬 Extract complex logic into well-named functions instead of explaining with comments. Remove ALL comments unless they impact functionality.',
      violations: []
    };
  }

  private createCriticalFilesGroup(): QualityGroup {
    return {
      title: 'CRITICAL: OVERSIZED FILES',
      description: 'Files over 300 lines are extremely difficult to maintain.',
      actionGuidance: '👧🏻💬 CRITICAL: Split these files into smaller, focused modules immediately.',
      violations: []
    };
  }

  private createLargeFilesGroup(): QualityGroup {
    return {
      title: 'LARGE FILES',
      description: 'Large files are harder to understand and maintain.',
      actionGuidance: '👧🏻💬 Break these files into smaller, focused modules with single responsibilities.',
      violations: []
    };
  }

  private createCriticalFunctionsGroup(): QualityGroup {
    return {
      title: 'CRITICAL: OVERSIZED FUNCTIONS',
      description: 'Functions over 10 lines violate single responsibility principle.',
      actionGuidance: '👧🏻💬 CRITICAL: Break down these functions immediately. Long functions may indicate an opportunity to introduce a new class.',
      violations: []
    };
  }

  private createLargeFunctionsGroup(): QualityGroup {
    return {
      title: 'LARGE FUNCTIONS',
      description: 'Functions approaching size limits should be refactored.',
      actionGuidance: '👧🏻💬 Consider extracting helper methods to improve readability.',
      violations: []
    };
  }

  private createUnusedMethodsGroup(): QualityGroup {
    return {
      title: 'UNUSED CODE',
      description: 'Dead code reduces codebase clarity and increases maintenance burden.',
      actionGuidance: '👧🏻💬 Remove these unused methods to maintain codebase clarity.',
      violations: []
    };
  }

  private createDuplicationGroup(): QualityGroup {
    return {
      title: 'CODE DUPLICATION',
      description: 'Duplicated code increases maintenance burden and error risk.',
      actionGuidance: '👧🏻💬 Extract common functionality into shared functions or classes.',
      violations: []
    };
  }

  private createComplexityGroup(): QualityGroup {
    return {
      title: 'HIGH COMPLEXITY',
      description: 'Complex functions are harder to understand, test, and maintain.',
      actionGuidance: '👧🏻💬 Break down complex functions into smaller, single-purpose methods.',
      violations: []
    };
  }

  private createDiffSizeGroup(): QualityGroup {
    return {
      title: 'LARGE CHANGES',
      description: 'Large diffs are harder to review and more likely to introduce bugs.',
      actionGuidance: '👧🏻💬 Commit smaller incremental changes with passing tests to maintain code quality.',
      violations: []
    };
  }

  private createChangeFrequencyGroup(): QualityGroup {
    return {
      title: 'OPEN-CLOSED PRINCIPLE VIOLATIONS',
      description: 'Files changing frequently suggest design should be extensible without modification.',
      actionGuidance: '👧🏻💬 Consider introducing abstractions, dependency injection, or plugin patterns to improve the design. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
      requiresUserConsultation: true,
      violations: []
    };
  }

  private createCohesiveChangeGroup(): QualityGroup {
    return {
      title: 'ABSTRACTION LEAKAGE',
      description: 'Files changing together suggest concerns not properly encapsulated.',
      actionGuidance: '👧🏻💬 Consider extracting shared abstractions or reducing coupling. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
      requiresUserConsultation: true,
      violations: []
    };
  }

  private createIncompleteRefactoringGroup(): QualityGroup {
    return {
      title: 'INCOMPLETE REFACTORINGS',
      description: 'Incomplete refactorings should be finished or marked complete.',
      actionGuidance: '👧🏻💬 Test these refactorings on files outside fixtures and update completion status.',
      violations: []
    };
  }

  private createDefaultGroup(): QualityGroup {
    return {
      title: 'OTHER ISSUES',
      description: 'Miscellaneous quality issues detected.',
      actionGuidance: '👧🏻💬 Address these issues as appropriate.',
      violations: []
    };
  }
}