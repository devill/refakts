import * as fs from 'fs';
import * as path from 'path';

interface RoadmapFeature {
  name: string;
  description: string;
  why?: string;
  score: number;
  status: 'proposed' | 'in-progress' | 'completed';
  tier: number;
  dependencies?: string[];
}

interface RoadmapData {
  features: RoadmapFeature[];
  lastUpdated: string;
}

class RoadmapManager {
  private roadmapFile = path.join(process.cwd(), 'roadmap-data.json');

  private loadRoadmap(): RoadmapData {
    if (!fs.existsSync(this.roadmapFile)) {
      return this.createDefaultRoadmap();
    }
    
    return JSON.parse(fs.readFileSync(this.roadmapFile, 'utf8'));
  }

  private createDefaultRoadmap(): RoadmapData {
    return {
      features: [
        { name: 'regex-ast-locator', description: 'Find AST nodes by text content', score: 0, status: 'proposed', tier: 1 },
        { name: 'selection-tool', description: 'Select AST ranges between two points', score: 0, status: 'proposed', tier: 1, dependencies: ['regex-ast-locator'] },
        { name: 'function-body-extractor', description: 'Get function body without reading entire files', score: 0, status: 'proposed', tier: 1, dependencies: ['regex-ast-locator'] },
        { name: 'complete-ast-query-engine', description: 'Complete node-finding-command', score: 0, status: 'in-progress', tier: 1 },
        { name: 'smart-method-extraction', description: 'Extract methods with automatic parameter detection', score: 0, status: 'proposed', tier: 2, dependencies: ['selection-tool', 'complete-ast-query-engine'] },
        { name: 'automated-dead-code-elimination', description: 'Safe removal of unused code', score: 0, status: 'proposed', tier: 2, dependencies: ['complete-ast-query-engine'] }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  private saveRoadmap(data: RoadmapData): void {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.roadmapFile, JSON.stringify(data, null, 2));
  }

  vote(featureName: string): void {
    const data = this.loadRoadmap();
    const feature = this.findFeature(data, featureName);
    
    feature.score += 1;
    this.saveRoadmap(data);
    
    console.log(`✅ Voted for '${featureName}' (now ${feature.score} votes)`);
  }

  private findFeature(data: RoadmapData, featureName: string): RoadmapFeature {
    const feature = data.features.find(f => f.name === featureName);
    
    if (!feature) {
      console.error(`❌ Feature '${featureName}' not found. Use 'npm run roadmap:status' to see available features.`);
      process.exit(1);
    }

    return feature;
  }

  add(featureName: string, description: string, why?: string, tier: number = 4): void {
    const data = this.loadRoadmap();
    
    this.validateFeatureDoesNotExist(data, featureName);
    this.addFeatureToRoadmap(data, featureName, description, why, tier);
    
    this.saveRoadmap(data);
    console.log(`✅ Added feature '${featureName}' to roadmap`);
  }

  private validateFeatureDoesNotExist(data: RoadmapData, featureName: string): void {
    if (data.features.find(f => f.name === featureName)) {
      console.error(`❌ Feature '${featureName}' already exists.`);
      process.exit(1);
    }
  }

  private addFeatureToRoadmap(data: RoadmapData, featureName: string, description: string, why?: string, tier: number = 4): void {
    data.features.push({
      name: featureName,
      description,
      why,
      score: 0,
      status: 'proposed',
      tier
    });
  }

  status(): void {
    const data = this.loadRoadmap();
    
    this.printHeader();
    this.printTierFeatures(data);
    this.printTopFeatures(data);
    this.printLastUpdated(data);
  }

  private printHeader(): void {
    console.log('🗺️  RefakTS Roadmap Status');
    console.log('=' .repeat(50));
  }

  private printTierFeatures(data: RoadmapData): void {
    for (let tier = 1; tier <= 4; tier++) {
      const tierFeatures = this.getTierFeatures(data, tier);
      
      if (tierFeatures.length === 0) continue;
      
      console.log(`\n📊 Tier ${tier} Features:`);
      this.printFeatureList(tierFeatures);
    }
  }

  private getTierFeatures(data: RoadmapData, tier: number): RoadmapFeature[] {
    return data.features
      .filter(f => f.tier === tier)
      .sort((a, b) => b.score - a.score);
  }

  private printFeatureList(features: RoadmapFeature[]): void {
    for (const feature of features) {
      this.printFeature(feature);
    }
  }

  private printFeature(feature: RoadmapFeature): void {
    const statusIcon = this.getStatusIcon(feature.status);
    const deps = feature.dependencies ? ` (depends: ${feature.dependencies.join(', ')})` : '';
    
    console.log(`  ${statusIcon} ${feature.name} (${feature.score} votes)${deps}`);
    console.log(`     ${feature.description}`);
    if (feature.why) {
      console.log(`     Why: ${feature.why}`);
    }
    console.log();
  }

  private getStatusIcon(status: string): string {
    return status === 'completed' ? '✅' : 
           status === 'in-progress' ? '🔄' : '🆕';
  }

  private printTopFeatures(data: RoadmapData): void {
    const topFeatures = data.features
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    console.log('🏆 Top Voted Features:');
    topFeatures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${f.score} votes)`);
    });
  }

  private printLastUpdated(data: RoadmapData): void {
    console.log(`\n📅 Last updated: ${new Date(data.lastUpdated).toLocaleDateString()}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new RoadmapManager();

  executeCommand(manager, command, args);
}

function executeCommand(manager: RoadmapManager, command: string, args: string[]): void {
  switch (command) {
    case 'vote':
      handleVoteCommand(manager, args);
      break;

    case 'add':
      handleAddCommand(manager, args);
      break;

    case 'status':
      manager.status();
      break;

    default:
      console.error('Usage: npm run roadmap:vote|add|status');
      process.exit(1);
  }
}

function handleVoteCommand(manager: RoadmapManager, args: string[]): void {
  if (!args[1]) {
    console.error('Usage: npm run roadmap:vote <feature-name>');
    process.exit(1);
  }
  manager.vote(args[1]);
}

function handleAddCommand(manager: RoadmapManager, args: string[]): void {
  const nameIndex = args.indexOf('--feature');
  const descIndex = args.indexOf('--description');
  const whyIndex = args.indexOf('--why');
  
  if (nameIndex === -1 || !args[nameIndex + 1] || descIndex === -1 || !args[descIndex + 1]) {
    console.error('Usage: npm run roadmap:add --feature <name> --description <desc> [--why <reason>]');
    process.exit(1);
  }
  
  const why = whyIndex !== -1 && args[whyIndex + 1] ? args[whyIndex + 1] : undefined;
  manager.add(args[nameIndex + 1], args[descIndex + 1], why);
}

if (require.main === module) {
  main();
}