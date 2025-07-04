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
  
  execute(_file: string, _options: CommandOptions): Promise<void>;
  validateOptions(_options: CommandOptions): void;
  getHelpText(): string;
}