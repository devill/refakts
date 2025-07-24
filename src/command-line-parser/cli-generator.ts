import { CommandRegistry } from '../core/commands/command-registry';
import { ConsoleOutput } from './output-formatter/console-output';

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