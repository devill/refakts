export class OptionParser {
  parse(args: string[], startIndex: number): Record<string, any> {
    const options: Record<string, any> = {};
    
    for (let i = startIndex + 2; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        i = this.processOptionFlag(args, i, options);
      }
    }
    
    return options;
  }

  private processOptionFlag(args: string[], index: number, options: Record<string, any>): number {
    const optionName = this.extractOptionName(args[index]);
    const nextArg = args[index + 1];
    
    if (this.isBooleanFlag(nextArg)) {
      return this.handleBooleanFlag(options, optionName, index);
    }
    
    return this.handleValueFlag(options, optionName, nextArg, index);
  }

  private handleBooleanFlag(options: Record<string, any>, optionName: string, index: number): number {
    options[optionName] = true;
    return index;
  }

  private handleValueFlag(options: Record<string, any>, optionName: string, nextArg: string, index: number): number {
    this.setOptionValue(options, optionName, nextArg);
    return index + 1;
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