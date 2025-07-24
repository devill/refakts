import { RoadmapData, RoadmapFeature } from './types';

export class RoadmapDisplay {
  showStatus(data: RoadmapData): void {
    this.printHeader();
    this.printAllFeatures(data);
    this.printTopFeatures(data);
    this.printLastUpdated(data);
  }

  private printHeader(): void {
    process.stdout.write('🗺️  RefakTS Roadmap Status\n');
    process.stdout.write('='.repeat(50) + '\n');
  }

  private printAllFeatures(data: RoadmapData): void {
    const sortedFeatures = this.getSortedFeatures(data);
    
    if (sortedFeatures.length === 0) {
      process.stdout.write('\n🎉 No pending features - roadmap is clear!\n');
      return;
    }
    
    this.printSortedFeatureList(sortedFeatures);
  }

  private printSortedFeatureList(sortedFeatures: RoadmapFeature[]): void {
    process.stdout.write('\n📊 All Features (by votes):\n');
    this.printFeatureList(sortedFeatures);
  }

  private getSortedFeatures(data: RoadmapData): RoadmapFeature[] {
    return data.features.sort((a, b) => b.score - a.score);
  }

  private printFeatureList(features: RoadmapFeature[]): void {
    for (const feature of features) {
      this.printFeature(feature);
    }
  }

  private printFeature(feature: RoadmapFeature): void {
    const statusIcon = this.getStatusIcon(feature.status);
    const deps = this.formatDependencies(feature.dependencies);
    
    process.stdout.write(`  ${statusIcon} ${feature.name} (${feature.score} votes)${deps}\n`);
    process.stdout.write(`     ${feature.description}\n`);
    this.printWhyIfPresent(feature.why);
    process.stdout.write('\n');
  }

  private formatDependencies(dependencies?: string[]): string {
    return dependencies ? ` (depends: ${dependencies.join(', ')})` : '';
  }

  private printWhyIfPresent(why?: string): void {
    if (why) {
      process.stdout.write(`     Why: ${why}\n`);
    }
  }

  private getStatusIcon(status: string): string {
    return status === 'completed' ? '✅' : 
           status === 'in-progress' ? '🔄' : '🆕';
  }

  private printTopFeatures(data: RoadmapData): void {
    const topFeatures = data.features
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    process.stdout.write('🏆 Top Voted Features:\n');
    topFeatures.forEach((f, i) => {
      process.stdout.write(`  ${i + 1}. ${this.formatFeatureDisplay(f)}\n`);
    });
  }

  private formatFeatureDisplay(feature: RoadmapFeature): string {
    return `${feature.name} (${feature.score} votes)`;
  }

  private printLastUpdated(data: RoadmapData): void {
    process.stdout.write(`\n📅 Last updated: ${new Date(data.lastUpdated).toLocaleDateString()}\n`);
  }
}