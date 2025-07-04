export interface CommandOption {
  flags: string;
  description: string;
}

export interface CommandOptions {
  [key: string]: unknown;
}

export interface RefactoringCommand {
  readonly name: string;
  readonly description: string;
  readonly complete: boolean;
  
  execute(file: string, options: CommandOptions): Promise<void>;
  validateOptions(options: CommandOptions): void;
  getHelpText(): string;
}