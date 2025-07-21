import { ExtractVariableCommand } from '../../src/commands/extract-variable-command';
import { LocationParser } from '../../src/core/location-range';

describe('CLI Location Handling', () => {
  it('should pass location to command options when using location format', () => {
    const command = new ExtractVariableCommand();
    const target = '[test.ts 1:1-1:10]';
    const options = { name: 'test' };

    // This simulates what executeCommandWithTarget does
    if (LocationParser.isLocationFormat(target)) {
      const location = LocationParser.parseLocation(target);
      const finalOptions = { ...options, location };

      // This should NOT throw an error because location is provided
      expect(() => command.validateOptions(finalOptions)).not.toThrow();
      
      // But if we validate the original options (what the bug causes), it should throw
      expect(() => command.validateOptions(options)).toThrow('Location format must be specified');
    }
  });

  it('should validate options after location is added to options object', () => {
    const command = new ExtractVariableCommand();
    const target = '[test.ts 1:1-1:10]';
    const baseOptions = { name: 'test' };
    
    // Simulate the CLI flow - the bug is that validation happens before location is added
    expect(() => command.validateOptions(baseOptions)).toThrow();
    
    // After location is added, validation should pass
    const location = LocationParser.parseLocation(target);
    const optionsWithLocation = { ...baseOptions, location };
    expect(() => command.validateOptions(optionsWithLocation)).not.toThrow();
  });
});