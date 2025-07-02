import { RoadmapData, RoadmapFeature } from './types';

export class RoadmapDisplay {
  showStatus(data: RoadmapData): void {
    this.printHeader();
    this.printTierFeatures(data);
    this.printTopFeatures(data);
    this.printLastUpdated(data);
  }

  private printHeader(): void {
    console.log('🗺️  RefakTS Roadmap Status');
    console.log('='.repeat(50));
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