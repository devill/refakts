import { QualityCheck, QualityIssue } from '../../dev/quality/quality-check-interface';
import { Project, SyntaxKind, SourceFile, Node } from 'ts-morph';
import * as path from 'path';

export const commentCheck: QualityCheck = {
  name: 'comment',
  check: (files: string[]): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(files);
    
    return project.getSourceFiles().flatMap(findCommentsInFile);
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'comment' ? {
    title: 'COMMENTS DETECTED',
    description: 'Comments indicate code that is not self-documenting.',
    actionGuidance: 'Extract complex logic into well-named functions instead of explaining with comments. Remove ALL comments unless they impact functionality.'
  } : undefined
};

const findCommentsInFile = (sourceFile: SourceFile): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return [];
  
  const singleComments = sourceFile.getDescendantsOfKind(SyntaxKind.SingleLineCommentTrivia)
    .filter((comment: Node) => isValidSingleComment(comment.getText().trim()))
    .filter((comment: Node) => !isEsLintDisable(comment.getText()))
    .map((comment: Node) => createCommentIssue(filePath, comment, 'single'));
    
  const multiComments = sourceFile.getDescendantsOfKind(SyntaxKind.MultiLineCommentTrivia)
    .filter((comment: Node) => isValidMultiComment(comment.getText().trim()))
    .filter((comment: Node) => !isEsLintDisable(comment.getText()))
    .map((comment: Node) => createCommentIssue(filePath, comment, 'multi'));
    
  const jsDocComments = sourceFile.getDescendantsOfKind(SyntaxKind.JSDocComment)
    .filter((comment: Node) => isValidJSDocComment(comment.getText().trim()))
    .map((comment: Node) => createCommentIssue(filePath, comment, 'JSDoc'));
    
  return [...singleComments, ...multiComments, ...jsDocComments];
};

const createCommentIssue = (filePath: string, comment: Node, type: string): QualityIssue => ({
  type: 'comment',
  message: `${type}-line comment: "${truncateText(comment.getText().trim())}"`,
  file: filePath,
  line: comment.getStartLineNumber()
});

const isValidSingleComment = (text: string): boolean =>
  text.startsWith('//') && !isExecutableAnnotation(text) && text.length >= 10;

const isValidMultiComment = (text: string): boolean =>
  (text.startsWith('/**') || text.startsWith('/*')) && !isExecutableAnnotation(text) && text.length >= 15;

const isValidJSDocComment = (text: string): boolean =>
  text.startsWith('/**') && !isExecutableAnnotation(text) && text.length >= 15;

const isExecutableAnnotation = (comment: string): boolean => {
  const executableAnnotations = ['@description', '@command', '@skip'];
  return executableAnnotations.some(annotation => comment.includes(annotation));
};

const isEsLintDisable = (comment: string): boolean =>
    comment.includes('eslint-disable');

const truncateText = (text: string): string =>
  text.length > 50 ? text.substring(0, 50) + '...' : text;

const shouldSkipFile = (filePath: string): boolean =>
    filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');