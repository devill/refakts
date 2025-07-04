import { SourceFile } from 'ts-morph';
import { SelectResult } from '../types/selection-types';

export interface SelectionStrategy {
  canHandle(options: Record<string, unknown>): boolean;
  select(sourceFile: SourceFile, options: Record<string, unknown>): Promise<SelectResult[]>;
  validateOptions(options: Record<string, unknown>): void;
}