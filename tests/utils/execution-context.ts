import {CommandExecutionContext} from "./command-executor";
import { CommandExecutionBase } from './command-execution-base';

export class ExecutionContext extends CommandExecutionBase {
  private commandName: string;

  constructor(context: CommandExecutionContext) {
    super(context.command, context.file, context.options, context.commandString);
    this.commandName = context.commandName;
  }

  getCommandName(): string {
    return this.commandName;
  }
}