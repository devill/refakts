import { RoadmapData, RoadmapFeature } from './types';
import { RoadmapStorage } from './roadmap-storage';

export class RoadmapService {
  private storage = new RoadmapStorage();

  vote(featureName: string): void {
    const data = this.storage.loadRoadmap();
    const feature = this.findFeature(data, featureName);
    
    feature.score += 1;
    this.storage.saveRoadmap(data);
    
    console.log(`✅ Voted for '${featureName}' (now ${feature.score} votes)`);
  }

  add(featureName: string, description: string, why?: string, tier: number = 4): void {
    const data = this.storage.loadRoadmap();
    
    this.validateFeatureDoesNotExist(data, featureName);
    this.addFeatureToRoadmap(data, featureName, description, why, tier);
    
    this.storage.saveRoadmap(data);
    console.log(`✅ Added feature '${featureName}' to roadmap`);
  }

  getRoadmapData(): RoadmapData {
    return this.storage.loadRoadmap();
  }

  private findFeature(data: RoadmapData, featureName: string): RoadmapFeature {
    const feature = data.features.find(f => f.name === featureName);
    
    if (!feature) {
      console.error(`❌ Feature '${featureName}' not found. Use 'npm run roadmap:status' to see available features.`);
      process.exit(1);
    }

    return feature;
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
}