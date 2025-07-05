import { SourceFile } from 'ts-morph';

export interface Transformation {
  transform(_sourceFile: SourceFile): Promise<void>;
}

export interface TransformationResult {
  success: boolean;
  changesCount: number;
  message?: string;
}

export interface TransformationWithResult {
  transformWithResult(_sourceFile: SourceFile): Promise<TransformationResult>;
}