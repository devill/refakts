import { SourceFile } from 'ts-morph';

export interface Transformation {
  transform(sourceFile: SourceFile): Promise<void>;
}

export interface TransformationResult {
  success: boolean;
  changesCount: number;
  message?: string;
}

export interface TransformationWithResult {
  transformWithResult(sourceFile: SourceFile): Promise<TransformationResult>;
}