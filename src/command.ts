export interface CommandOption {
  flags: string;
  description: string;
}

export interface RefactoringCommand {
  readonly name: string;
  readonly description: string;
  readonly complete: boolean;
  
  execute(file: string, options: Record<string, any>): Promise<void>;
  validateOptions(options: Record<string, any>): void;
  getHelpText(): string;
  getOptions(): CommandOption[];
}