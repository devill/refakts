import { RoadmapData, RoadmapFeature } from './types';

export class RoadmapDisplay {
  showStatus(data: RoadmapData): void {
    this.printHeader();
    this.printAllFeatures(data);
    this.printTopFeatures(data);
    this.printLastUpdated(data);
  }

  private printHeader(): void {
    console.log('🗺️  RefakTS Roadmap Status');
    console.log('='.repeat(50));
  }

  private printAllFeatures(data: RoadmapData): void {
    const sortedFeatures = data.features
      .sort((a, b) => b.score - a.score);
    
    if (sortedFeatures.length === 0) {
      console.log('\n🎉 No pending features - roadmap is clear!');
      return;
    }
    
    console.log('\n📊 All Features (by votes):');
    this.printFeatureList(sortedFeatures);
  }

  private printFeatureList(features: RoadmapFeature[]): void {
    for (const feature of features) {
      this.printFeature(feature);
    }
  }

  private printFeature(feature: RoadmapFeature): void {
    const statusIcon = this.getStatusIcon(feature.status);
    const deps = this.formatDependencies(feature.dependencies);
    
    console.log(`  ${statusIcon} ${feature.name} (${feature.score} votes)${deps}`);
    console.log(`     ${feature.description}`);
    this.printWhyIfPresent(feature.why);
    console.log();
  }

  private formatDependencies(dependencies?: string[]): string {
    return dependencies ? ` (depends: ${dependencies.join(', ')})` : '';
  }

  private printWhyIfPresent(why?: string): void {
    if (why) {
      console.log(`     Why: ${why}`);
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
    
    console.log('🏆 Top Voted Features:');
    topFeatures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${f.score} votes)`);
    });
  }

  private printLastUpdated(data: RoadmapData): void {
    console.log(`\n📅 Last updated: ${new Date(data.lastUpdated).toLocaleDateString()}`);
  }
}