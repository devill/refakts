import {CommandExecutionContext} from "../command-executor";
import { CommandExecutionBase } from '../command-execution-base';

export class CommandExecutionBuilder extends CommandExecutionBase {
  private commandName = '';

  constructor() {
    super(null as any, '', {}, '');
  }

  with(context: CommandExecutionContext) {
    this.command = context.command;
    this.file = context.file;
    this.options = context.options;
    this.commandString = context.commandString;
    this.commandName = context.commandName;
    return this;
  }

  static create(): CommandExecutionBuilder {
    return new CommandExecutionBuilder();
  }
}