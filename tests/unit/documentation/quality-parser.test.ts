import { verify } from 'approvals';
import { 
  MOCK_QUALITY_CHECKS,
  EMPTY_QUALITY_CHECKS,
  BROKEN_QUALITY_CHECK,
  NO_GROUP_DEFINITIONS
} from '../../fixtures/unit/documentation/quality-check-samples';

// Copy the quality checks parsing logic for testing
// We'll need to extract these to a testable module in the refactor

function getQualityChecksContent(qualityChecks: Array<{ name: string; getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined }>): string {
  const descriptions = new Set<string>();
  
  for (const check of qualityChecks) {
    addCheckDescriptions(check, descriptions);
  }
  
  return formatDescriptions(descriptions);
}

function addCheckDescriptions(check: { name: string; getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined }, descriptions: Set<string>): void {
  const groupKeys = getValidGroupKeys(check);
  for (const groupKey of groupKeys) {
    const groupDef = check.getGroupDefinition?.(groupKey);
    if (groupDef) {
      descriptions.add(`- **${groupDef.title}** (${groupDef.description})`);
    }
  }
}

function formatDescriptions(descriptions: Set<string>): string {
  return descriptions.size > 0 
    ? Array.from(descriptions).join('\n')
    : '- No quality checks configured';
}

function getValidGroupKeys(check: { name: string; getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined }): string[] {
  const possibleKeys = buildPossibleKeys(check);
  return possibleKeys.filter(key => isValidKey(check, key));
}

function buildPossibleKeys(check: { name: string }): string[] {
  return [
    check.name,
    `${check.name}Functions`,
    `critical${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    `large${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    'changeFrequency',
    'cohesiveChange'
  ];
}

function isValidKey(check: { getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined }, key: string): boolean {
  try {
    return Boolean(check.getGroupDefinition?.(key));
  } catch {
    return false;
  }
}

describe('Quality Parser', () => {

  test('extracts descriptions from quality checks', () => {
    const result = getQualityChecksContent(MOCK_QUALITY_CHECKS);
    verify(__dirname, 'quality-parser.extracts descriptions from quality checks', result, { reporters: ['donothing'] });
  });

  test('handles empty quality checks array', () => {
    const result = getQualityChecksContent(EMPTY_QUALITY_CHECKS);
    verify(__dirname, 'quality-parser.handles empty quality checks array', result, { reporters: ['donothing'] });
  });

  test('handles broken quality check gracefully', () => {
    const result = getQualityChecksContent(BROKEN_QUALITY_CHECK);
    verify(__dirname, 'quality-parser.handles broken quality check gracefully', result, { reporters: ['donothing'] });
  });

  test('handles quality check with no group definitions', () => {
    const result = getQualityChecksContent(NO_GROUP_DEFINITIONS);
    verify(__dirname, 'quality-parser.handles quality check with no group definitions', result, { reporters: ['donothing'] });
  });
});