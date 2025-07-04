import { RoadmapService } from './roadmap-service';
import { RoadmapDisplay } from './roadmap-display';

export class RoadmapCLI {
  private service = new RoadmapService();
  private display = new RoadmapDisplay();

  handleCommand(command: string, args: string[]): void {
    const commandHandler = this.getCommandHandler(command, args);
    
    if (commandHandler) {
      commandHandler();
    } else {
      this.showUsage();
    }
  }

  private getCommandHandler(command: string, args: string[]): (() => void) | undefined {
    const commandMap: Record<string, () => void> = {
      'vote': () => this.handleVoteCommand(args),
      'add': () => this.handleAddCommand(args),
      'status': () => this.handleStatusCommand()
    };

    return commandMap[command];
  }

  private showUsage(): void {
    process.stderr.write('Usage: npm run roadmap:vote|add|status\n');
    process.exit(1);
  }

  private handleVoteCommand(args: string[]): void {
    if (!args[1]) {
      process.stderr.write('Usage: npm run roadmap:vote <feature-name>\n');
      process.exit(1);
    }
    this.service.vote(args[1]);
  }

  private handleAddCommand(args: string[]): void {
    const addArgs = this.parseAddArguments(args);
    this.service.add(addArgs.name, addArgs.description, addArgs.why);
  }

  private handleStatusCommand(): void {
    const data = this.service.getRoadmapData();
    this.display.showStatus(data);
  }

  private parseAddArguments(args: string[]): { name: string; description: string; why?: string } {
    const indices = this.extractArgumentIndices(args);
    this.validateRequiredArguments(indices, args);
    
    return {
      name: args[indices.nameIndex + 1],
      description: args[indices.descIndex + 1],
      why: this.extractOptionalWhy(indices.whyIndex, args)
    };
  }

  private extractArgumentIndices(args: string[]): { nameIndex: number; descIndex: number; whyIndex: number } {
    return {
      nameIndex: args.indexOf('--feature'),
      descIndex: args.indexOf('--description'),
      whyIndex: args.indexOf('--why')
    };
  }

  private validateRequiredArguments(indices: { nameIndex: number; descIndex: number }, args: string[]): void {
    if (indices.nameIndex === -1 || !args[indices.nameIndex + 1] || indices.descIndex === -1 || !args[indices.descIndex + 1]) {
      process.stderr.write('Usage: npm run roadmap:add --feature <name> --description <desc> [--why <reason>]\n');
      process.exit(1);
    }
  }

  private extractOptionalWhy(whyIndex: number, args: string[]): string | undefined {
    return whyIndex !== -1 && args[whyIndex + 1] ? args[whyIndex + 1] : undefined;
  }
}