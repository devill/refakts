import { CommandRegistry } from './command-registry';
import { ConsoleOutput } from './interfaces/ConsoleOutput';

// Simple ConsoleOutput implementation for CLI generator
class SimpleConsoleOutput implements ConsoleOutput {
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  write(data: string): void {
    process.stdout.write(data);
  }
}

export function getIncompleteRefactorings(): string[] {
  const commandRegistry = new CommandRegistry(new SimpleConsoleOutput(), true);
  const commands = commandRegistry.getAllCommands();
  
  return commands
    .filter(command => !command.complete)
    .map(command => command.name);
}