import { QualityCheck, QualityIssue, QualityGroup } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const unusedMethodCheck: QualityCheck = {
  name: 'unusedMethod',
  check: async (sourceDir: string): Promise<QualityIssue[]> => {
    try {
      const members = await getUnusedClassMembers();
      return members.map(toQualityIssue);
    } catch (error) {
      return [];
    }
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'unusedMethod' ? {
    title: 'UNUSED CODE',
    description: 'Dead code reduces codebase clarity and increases maintenance burden.',
    actionGuidance: 'Remove these unused methods to maintain codebase clarity.'
  } : undefined
};

const getUnusedClassMembers = async (): Promise<any[]> => {
  const { stdout } = await execAsync('npx knip --include classMembers --reporter json');
  return JSON.parse(stdout).issues?.classMembers || [];
};

const toQualityIssue = (member: any): QualityIssue => ({
  type: 'unusedMethod',
  severity: 'critical',
  message: `Unused method '${member.name}' in ${member.file}`,
  file: member.file
});