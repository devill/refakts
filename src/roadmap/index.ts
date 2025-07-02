import { RoadmapCLI } from './roadmap-cli';

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cli = new RoadmapCLI();

  cli.handleCommand(command, args);
}

if (require.main === module) {
  main();
}

export { RoadmapService } from './roadmap-service';
export { RoadmapDisplay } from './roadmap-display';
export { RoadmapStorage } from './roadmap-storage';
export { RoadmapCLI } from './roadmap-cli';
export * from './types';