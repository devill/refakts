import { ExtractVariableCommand } from '../../src/core/commands/extract-variable-command';
import { LocationParser } from '../../src/core/ast/location-range';

describe('CLI Location Handling', () => {
  function simulateExecuteCommandWithTarget(target: string, options: any) {
    if (LocationParser.isLocationFormat(target)) {
      const location = LocationParser.parseLocation(target);
      return { ...options, location };
    }
    return options;
  }

  function expectValidationToPassAfterLocationAdded(command: any, finalOptions: any) {
    expect(() => command.validateOptions(finalOptions)).not.toThrow();
  }

  function expectValidationToFailWithoutLocation(command: any, options: any) {
    expect(() => command.validateOptions(options)).toThrow('Location format must be specified');
  }

  it('should pass location to command options when using location format', () => {
    const command = new ExtractVariableCommand();
    const target = '[test.ts 1:1-1:10]';
    const options = { name: 'test' };

    const finalOptions = simulateExecuteCommandWithTarget(target, options);
    expectValidationToPassAfterLocationAdded(command, finalOptions);
    expectValidationToFailWithoutLocation(command, options);
  });

  it('should validate options after location is added to options object', () => {
    const command = new ExtractVariableCommand();
    const target = '[test.ts 1:1-1:10]';
    const baseOptions = { name: 'test' };
    
    expectValidationToFailWithoutLocation(command, baseOptions);
    
    const location = LocationParser.parseLocation(target);
    const optionsWithLocation = { ...baseOptions, location };
    expectValidationToPassAfterLocationAdded(command, optionsWithLocation);
  });
});