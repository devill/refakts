import {QualityCheck, QualityIssue} from '../quality-check-interface';
import {exec} from 'child_process';
import {promisify} from 'util';
import * as path from 'path';
import {getLinterGroupDefinition} from './linter-groups';

const execAsync = promisify(exec);

const RULE_TO_TYPE: Record<string, string> = {
  'max-lines': 'fileSize',
  'max-lines-per-function': 'functionSize',
  'complexity': 'cyclomaticComplexity',
  'max-params': 'manyParameters',
  '@typescript-eslint/no-require-imports': 'requireStatements',
  'import/first': 'requireStatements'
};

interface EslintMessage {
  ruleId: string;
  severity: number;
  message: string;
  line: number;
  column: number;
  fix?: unknown;
}

interface EslintResult {
  filePath: string;
  messages: EslintMessage[];
}

interface LinterData {
  ruleId: string;
  column: number;
  fixable: boolean;
}

function createLinterData(message: EslintMessage): LinterData {
  return {
    ruleId: message.ruleId,
    column: message.column,
    fixable: !!message.fix
  };
}

function determineSeverity(message: EslintMessage): 'critical' | 'warning' {
  return message.severity === 2 ? 'critical' : 'warning';
}

function convertMessageToIssue(message: EslintMessage, filePath: string): QualityIssue {
  const mappedType = RULE_TO_TYPE[message.ruleId];
  return mappedType
    ? buildMappedIssue(message, filePath, mappedType)
    : buildGenericIssue(message, filePath);
}

function buildMappedIssue(message: EslintMessage, filePath: string, type: string): QualityIssue {
  return {
    type,
    severity: determineSeverity(message),
    message: message.message,
    file: path.relative(process.cwd(), filePath),
    line: message.line,
    data: createLinterData(message)
  };
}

function buildGenericIssue(message: EslintMessage, filePath: string): QualityIssue {
  return {
    type: 'linter-violation',
    severity: determineSeverity(message),
    message: `${message.ruleId}: ${message.message}`,
    file: filePath,
    line: message.line,
    data: createLinterData(message)
  };
}

function processEslintResult(result: EslintResult): QualityIssue[] {
  if (!result.messages || result.messages.length === 0) {
    return [];
  }
  return result.messages.map(message => convertMessageToIssue(message, result.filePath));
}

function parseEslintResults(stdout: string): QualityIssue[] {
  if (!stdout.trim()) {
    return [];
  }
  const results = JSON.parse(stdout) as EslintResult[];
  return results.flatMap(processEslintResult);
}

function filterNonFixtureFiles(files: string[]): string[] {
  return files.filter(file => !file.endsWith('.fixture.ts'));
}

function createLinterError(message: string): QualityIssue {
  return {
    type: 'linter-error',
    severity: 'critical',
    message
  };
}

async function handleLinterError(error: Error): Promise<QualityIssue[]> {
  if (error.message.includes('Command failed')) {
    return await handleEslintCommandFailed();
  }
  return [createLinterError(`Linter check failed: ${error.message}`)];
}

async function handleEslintCommandFailed(): Promise<QualityIssue[]> {
  try {
    const { stdout } = await execAsync('npx eslint src tests/integration tests/utils tests/unit --ext .ts --ignore-pattern "**/*.fixture.ts" --format json').catch(err => ({ stdout: err.stdout }));

    if (stdout) {
      return parseEslintResults(stdout);
    }
  } catch (parseError) {
    return [createLinterError(`Failed to parse ESLint output: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)];
  }
  return [];
}

async function runEslintForFiles(files: string[]): Promise<QualityIssue[]> {
  const fileArgs = files.map(f => `'${f}'`).join(' ');
  const { stdout, stderr } = await execAsync(`npx eslint ${fileArgs} --format json --no-warn-ignored`);

  if (stderr && !stderr.includes('warning')) {
    return [createLinterError(`ESLint execution failed: ${stderr}`)];
  }

  return parseEslintResults(stdout);
}

async function checkLinterFiles(files: string[]): Promise<QualityIssue[]> {
  if (shouldSkipLinting(files)) {
    return [];
  }

  try {
    return await runEslintForFiles(filterNonFixtureFiles(files));
  } catch (error) {
    return await handleLinterError(error as Error);
  }
}

function shouldSkipLinting(files: string[]): boolean {
  if (files.length === 0) {
    return true;
  }

  const filteredFiles = filterNonFixtureFiles(files);
  return filteredFiles.length === 0;
}

export const linterCheck: QualityCheck = {
  name: 'linter-check',
  check: checkLinterFiles,
  getGroupDefinition: getLinterGroupDefinition
};
