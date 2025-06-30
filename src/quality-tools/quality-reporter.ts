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

    const sections: string[] = ['❌ Quality issues detected:'];
    
    for (const group of this.groups.values()) {
      if (group.violations.length > 0) {
        sections.push(this.formatGroup(group));
      }
    }
    
    return sections.join('\n\n');
  }

  private getGroupKey(issue: QualityIssue): string {
    switch (issue.type) {
      case 'comment': return 'comments';
      case 'fileSize': return issue.severity === 'critical' ? 'criticalFiles' : 'largeFiles';
      case 'functionSize': return issue.severity === 'critical' ? 'criticalFunctions' : 'largeFunctions';
      case 'unusedMethod': return 'unusedMethods';
      case 'duplication': return 'duplication';
      case 'complexity': return 'complexity';
      case 'diffSize': return 'diffSize';
      case 'changeFrequency': return 'changeFrequency';
      case 'cohesiveChange': return 'cohesiveChange';
      case 'incompleteRefactoring': return 'incompleteRefactoring';
      default: return 'other';
    }
  }

  private createGroup(issue: QualityIssue): QualityGroup {
    const groupKey = this.getGroupKey(issue);
    switch (groupKey) {
      case 'comments':
        return {
          title: 'COMMENTS DETECTED',
          description: 'Comments indicate code that is not self-documenting.',
          actionGuidance: '👧🏻💬 Extract complex logic into well-named functions instead of explaining with comments. Remove ALL comments unless they impact functionality.',
          violations: []
        };
      
      case 'criticalFiles':
        return {
          title: 'CRITICAL: OVERSIZED FILES',
          description: 'Files over 300 lines are extremely difficult to maintain.',
          actionGuidance: '👧🏻💬 CRITICAL: Split these files into smaller, focused modules immediately.',
          violations: []
        };
      
      case 'largeFiles':
        return {
          title: 'LARGE FILES',
          description: 'Large files are harder to understand and maintain.',
          actionGuidance: '👧🏻💬 Break these files into smaller, focused modules with single responsibilities.',
          violations: []
        };
      
      case 'criticalFunctions':
        return {
          title: 'CRITICAL: OVERSIZED FUNCTIONS',
          description: 'Functions over 10 lines violate single responsibility principle.',
          actionGuidance: '👧🏻💬 CRITICAL: Break down these functions immediately. Long functions may indicate an opportunity to introduce a new class.',
          violations: []
        };
      
      case 'largeFunctions':
        return {
          title: 'LARGE FUNCTIONS',
          description: 'Functions approaching size limits should be refactored.',
          actionGuidance: '👧🏻💬 Consider extracting helper methods to improve readability.',
          violations: []
        };
      
      case 'unusedMethods':
        return {
          title: 'UNUSED CODE',
          description: 'Dead code reduces codebase clarity and increases maintenance burden.',
          actionGuidance: '👧🏻💬 Remove these unused methods to maintain codebase clarity.',
          violations: []
        };
      
      case 'duplication':
        return {
          title: 'CODE DUPLICATION',
          description: 'Duplicated code increases maintenance burden and error risk.',
          actionGuidance: '👧🏻💬 Extract common functionality into shared functions or classes.',
          violations: []
        };
      
      case 'complexity':
        return {
          title: 'HIGH COMPLEXITY',
          description: 'Complex functions are harder to understand, test, and maintain.',
          actionGuidance: '👧🏻💬 Break down complex functions into smaller, single-purpose methods.',
          violations: []
        };
      
      case 'diffSize':
        return {
          title: 'LARGE CHANGES',
          description: 'Large diffs are harder to review and more likely to introduce bugs.',
          actionGuidance: '👧🏻💬 Commit smaller incremental changes with passing tests to maintain code quality.',
          violations: []
        };
      
      case 'changeFrequency':
        return {
          title: 'OPEN-CLOSED PRINCIPLE VIOLATIONS',
          description: 'Files changing frequently suggest design should be extensible without modification.',
          actionGuidance: '👧🏻💬 Consider introducing abstractions, dependency injection, or plugin patterns to improve the design. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
          requiresUserConsultation: true,
          violations: []
        };
      
      case 'cohesiveChange':
        return {
          title: 'ABSTRACTION LEAKAGE',
          description: 'Files changing together suggest concerns not properly encapsulated.',
          actionGuidance: '👧🏻💬 Consider extracting shared abstractions or reducing coupling. Suggest the improvement to the user starting with the ⚠️ emoji a detailed explanation of your design suggestion.',
          requiresUserConsultation: true,
          violations: []
        };
      
      case 'incompleteRefactoring':
        return {
          title: 'INCOMPLETE REFACTORINGS',
          description: 'Incomplete refactorings should be finished or marked complete.',
          actionGuidance: '👧🏻💬 Test these refactorings on files outside fixtures and update completion status.',
          violations: []
        };
      
      default:
        return {
          title: 'OTHER ISSUES',
          description: 'Miscellaneous quality issues detected.',
          actionGuidance: '👧🏻💬 Address these issues as appropriate.',
          violations: []
        };
    }
  }

  private formatViolation(issue: QualityIssue): string {
    return issue.message;
  }

  private formatGroup(group: QualityGroup): string {
    const lines = [
      `**${group.title}**`,
      group.description,
      group.actionGuidance,
      'Violations:'
    ];
    
    for (const violation of group.violations) {
      lines.push(`- ${violation}`);
    }
    
    return lines.join('\n');
  }
}