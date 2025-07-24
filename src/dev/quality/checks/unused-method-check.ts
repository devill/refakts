import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface UnusedMember {
  name: string;
  file: string;
}

interface KnipOutput {
  issues?: {
    classMembers?: UnusedMember[];
  };
}

export const unusedMethodCheck: QualityCheck = {
  name: 'unusedMethod',
  check: async (files: string[]): Promise<QualityIssue[]> => {
    try {
      const members = await getUnusedClassMembers();
      return members
        .filter(member => files.includes(member.file))
        .map(toQualityIssue);
    } catch {
      return [];
    }
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'unusedMethod' ? {
    title: 'UNUSED CODE',
    description: 'Dead code reduces codebase clarity and increases maintenance burden.',
    actionGuidance: 'Remove these unused methods to maintain codebase clarity.'
  } : undefined
};

const getUnusedClassMembers = async (): Promise<UnusedMember[]> => {
  const { stdout } = await execAsync('npx knip --include classMembers --reporter json');
  const output = JSON.parse(stdout) as KnipOutput;
  return output.issues?.classMembers || [];
};

const toQualityIssue = (member: UnusedMember): QualityIssue => ({
  type: 'unusedMethod',
  severity: 'critical',
  message: `Unused method '${member.name}' in ${member.file}`,
  file: member.file
});