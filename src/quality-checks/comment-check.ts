import { QualityCheck, QualityIssue } from '../quality-tools/quality-check-interface';
import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';

export const commentCheck: QualityCheck = {
  name: 'comment',
  check: (sourceDir: string): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(`${sourceDir}/**/*.ts`);
    
    return project.getSourceFiles().flatMap(findCommentsInFile);
  }
};

const findCommentsInFile = (sourceFile: any): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return [];
  
  const singleComments = sourceFile.getDescendantsOfKind(SyntaxKind.SingleLineCommentTrivia)
    .filter((comment: any) => isValidSingleComment(comment.getText().trim()))
    .map((comment: any) => createCommentIssue(filePath, comment, 'single'));
    
  const multiComments = sourceFile.getDescendantsOfKind(SyntaxKind.MultiLineCommentTrivia)
    .filter((comment: any) => isValidMultiComment(comment.getText().trim()))
    .map((comment: any) => createCommentIssue(filePath, comment, 'multi'));
    
  return [...singleComments, ...multiComments];
};

const createCommentIssue = (filePath: string, comment: any, type: string): QualityIssue => ({
  type: 'comment',
  message: `${type}-line comment: "${truncateText(comment.getText().trim())}"`,
  file: filePath,
  line: comment.getStartLineNumber()
});

const isValidSingleComment = (text: string): boolean =>
  text.startsWith('//') && !text.startsWith('// @') && text.length >= 10;

const isValidMultiComment = (text: string): boolean =>
  !text.startsWith('/**') && text.length >= 15;

const truncateText = (text: string): string =>
  text.length > 50 ? text.substring(0, 50) + '...' : text;

const shouldSkipFile = (filePath: string): boolean =>
  filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.d.ts');