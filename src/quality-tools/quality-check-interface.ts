export interface QualityIssue {
  type: string;
  severity?: 'critical' | 'warning' | 'warn';
  message: string;
  file?: string;
  line?: number;
  data?: any;
}

export interface QualityCheck {
  name: string;
  check: (sourceDir: string) => Promise<QualityIssue[]> | QualityIssue[];
  getGroupDefinition?: (groupKey: string) => Omit<QualityGroup, 'violations'> | undefined;
}

export interface QualityGroup {
  title: string;
  description: string;
  actionGuidance: string;
  requiresUserConsultation?: boolean;
  violations: string[];
}