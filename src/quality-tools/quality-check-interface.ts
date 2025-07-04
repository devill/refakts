export interface QualityIssue {
  type: string;
  severity?: 'critical' | 'warning' | 'warn';
  message: string;
  file?: string;
  line?: number;
  data?: unknown;
}

export interface QualityCheck {
  name: string;
  check: (_sourceDir: string) => Promise<QualityIssue[]> | QualityIssue[];
  getGroupDefinition?: (_groupKey: string) => Omit<QualityGroup, 'violations'> | undefined;
}

export interface QualityGroup {
  title: string;
  description: string;
  actionGuidance: string;
  requiresUserConsultation?: boolean;
  violations: string[];
}