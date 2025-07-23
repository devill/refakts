import { RoadmapCLI } from '../../roadmap/roadmap-cli';

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cli = new RoadmapCLI();

  cli.handleCommand(command, args);
}

if (require.main === module) {
  main();
}

export { RoadmapService } from '../../roadmap/roadmap-service';
export { RoadmapDisplay } from '../../roadmap/roadmap-display';
export { RoadmapStorage } from '../../roadmap/roadmap-storage';
export { RoadmapCLI } from '../../roadmap/roadmap-cli';
export * from '../../roadmap/types';