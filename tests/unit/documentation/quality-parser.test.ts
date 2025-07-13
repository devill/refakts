import * as fs from 'fs';
import * as path from 'path';
import { 
  MOCK_QUALITY_CHECKS,
  EMPTY_QUALITY_CHECKS,
  BROKEN_QUALITY_CHECK,
  NO_GROUP_DEFINITIONS
} from '../../fixtures/unit/documentation/quality-check-samples';
import { GoldenFileTestUtility } from '../../utils/golden-file-test-utility';

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
  const expectedDir = path.join(__dirname, '../../fixtures/unit/documentation');

  test('extracts descriptions from quality checks', () => {
    const result = getQualityChecksContent(MOCK_QUALITY_CHECKS);
    GoldenFileTestUtility.expectToMatchGoldenFile(
      result,
      expectedDir,
      'mock-quality-checks.expected.txt'
    );
  });

  test('handles empty quality checks array', () => {
    const result = getQualityChecksContent(EMPTY_QUALITY_CHECKS);
    const expectedPath = path.join(expectedDir, 'empty-quality-checks.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles broken quality check gracefully', () => {
    const result = getQualityChecksContent(BROKEN_QUALITY_CHECK);
    const expectedPath = path.join(expectedDir, 'broken-quality-check.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });

  test('handles quality check with no group definitions', () => {
    const result = getQualityChecksContent(NO_GROUP_DEFINITIONS);
    const expectedPath = path.join(expectedDir, 'no-group-definitions.expected.txt');
    
    if (!fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, result);
    }
    
    const expected = fs.readFileSync(expectedPath, 'utf8');
    expect(result).toBe(expected);
  });
});