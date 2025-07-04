export interface CommandOption {
  flags: string;
  description: string;
}

export interface RefactoringCommand {
  readonly name: string;
  readonly description: string;
  readonly complete: boolean;
  
  // eslint-disable-next-line no-unused-vars
  execute(file: string, options: Record<string, any>): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  validateOptions(options: Record<string, any>): void;
  getHelpText(): string;
}