export interface CommandOption {
  flags: string;
  description: string;
}

export interface CommandOptions {
  [key: string]: unknown;
}

export class CommandOptionsWrapper {
  constructor(private _options: CommandOptions) {}

  get raw(): CommandOptions {
    return this._options;
  }

  shouldIncludeLine(): boolean {
    return !!(this._options['include-line'] || this._options.includeLine);
  }

  shouldPreviewLine(): boolean {
    return !!(this._options['preview-line'] || this._options.previewLine);
  }

  get(key: string): unknown {
    return this._options[key];
  }
}

export interface RefactoringCommand {
  readonly name: string;
  readonly description: string;
  readonly complete: boolean;
  
  execute(_file: string, _options: CommandOptions): Promise<void>;
  validateOptions(_options: CommandOptions): void;
  getHelpText(): string;
}