import { CommandRegistry } from './command-registry';


function buildCommandLines(commands: any[]): string[] {
  return commands.map(command => {
    const warningText = !command.complete ? ' (incomplete)' : '';
    return `  ${command.name}${warningText} - ${command.description}`;
  });
}

function formatHelpText(commandLines: string[]): string {
  return commandLines.length > 0 ? commandLines.join('\n') : 'No refactoring commands available';
}

export function getIncompleteRefactorings(): string[] {
  const commandRegistry = new CommandRegistry();
  const commands = commandRegistry.getAllCommands();
  
  return commands
    .filter(command => !command.complete)
    .map(command => command.name);
}