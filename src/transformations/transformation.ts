import { SourceFile } from 'ts-morph';

/**
 * Base interface for all transformations.
 * Each transformation is configured via constructor and performs its operation via transform().
 */
export interface Transformation {
  /**
   * Performs the transformation on the given source file.
   * @param sourceFile The source file to transform
   * @returns Promise resolving when transformation is complete
   */
  transform(sourceFile: SourceFile): Promise<void>;
}

/**
 * Transformation result interface for operations that may need to report what they changed.
 */
export interface TransformationResult {
  success: boolean;
  changesCount: number;
  message?: string;
}

/**
 * Enhanced transformation interface for operations that need detailed result reporting.
 */
export interface TransformationWithResult {
  /**
   * Performs the transformation and returns detailed results.
   * @param sourceFile The source file to transform
   * @returns Promise resolving to transformation results
   */
  transformWithResult(sourceFile: SourceFile): Promise<TransformationResult>;
}