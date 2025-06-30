import { CommandRegistry } from './command-registry';

export function getIncompleteRefactorings(): string[] {
  const commandRegistry = new CommandRegistry();
  const commands = commandRegistry.getAllCommands();
  
  return commands
    .filter(command => !command.complete)
    .map(command => command.name);
}