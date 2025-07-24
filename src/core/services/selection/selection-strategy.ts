import { SourceFile } from 'ts-morph';
import { SelectResult } from './selection-types';

export interface SelectionStrategy {
  canHandle(_options: Record<string, unknown>): boolean;
  select(_sourceFile: SourceFile, _options: Record<string, unknown>): Promise<SelectResult[]>;
  validateOptions(_options: Record<string, unknown>): void;
}