export interface RefactoringCommand {
  execute(file: string, options: Record<string, any>): Promise<void>;
  validateOptions(options: Record<string, any>): void;
}