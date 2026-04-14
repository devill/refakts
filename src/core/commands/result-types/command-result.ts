/**
 * Base interface for all command results.
 * Commands return structured data instead of void, enabling reuse in different contexts.
 */
export interface CommandResult {
  type: string;
}
