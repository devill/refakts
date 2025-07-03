import { SourceFile } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';

export interface SelectionStrategy {
  canHandle(options: Record<string, any>): boolean;
  select(sourceFile: SourceFile, options: Record<string, any>): Promise<SelectResult[]>;
  validateOptions(options: Record<string, any>): void;
}