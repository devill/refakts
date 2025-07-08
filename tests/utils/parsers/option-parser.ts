interface OptionProcessingConfig {
  options: Record<string, any>;
  optionName: string;
  nextArg: string;
  index: number;
}

export class OptionParser {
  parse(args: string[]): Record<string, any> {
    const options: Record<string, any> = {};
    this.processOptionFlags(args, options);
    return options;
  }

  private processOptionFlags(args: string[], options: Record<string, any>): void {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        i = this.processOptionFlag(args, i, options);
      }
    }
  }

  private processOptionFlag(args: string[], index: number, options: Record<string, any>): number {
    const optionName = this.extractOptionName(args[index]);
    const nextArg = args[index + 1];
    
    if (this.isBooleanFlag(nextArg)) {
      return this.handleBooleanFlag(options, optionName, index);
    }
    
    const config: OptionProcessingConfig = {
      options,
      optionName,
      nextArg,
      index
    };
    
    return this.handleValueFlag(config);
  }

  private handleBooleanFlag(options: Record<string, any>, optionName: string, index: number): number {
    options[optionName] = true;
    return index;
  }

  private handleValueFlag(config: OptionProcessingConfig): number {
    this.setOptionValue(config.options, config.optionName, config.nextArg);
    return config.index + 1;
  }

  private extractOptionName(arg: string): string {
    return arg.slice(2);
  }

  private isBooleanFlag(nextArg: string): boolean {
    return !nextArg || nextArg.startsWith('--');
  }

  private setOptionValue(options: Record<string, any>, optionName: string, value: string): void {
    if (options[optionName] !== undefined) {
      this.addToExistingOption(options, optionName, value);
    } else {
      const numValue = Number(value);
      options[optionName] = isNaN(numValue) ? value : numValue;
    }
  }

  private addToExistingOption(options: Record<string, any>, optionName: string, value: string): void {
    if (!Array.isArray(options[optionName])) {
      options[optionName] = [options[optionName]];
    }
    options[optionName].push(value);
  }
}