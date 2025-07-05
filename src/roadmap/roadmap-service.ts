import { RoadmapData, RoadmapFeature } from './types';
import { RoadmapStorage } from './roadmap-storage';

export class RoadmapService {
  private storage = new RoadmapStorage();

  vote(featureName: string): void {
    const data = this.storage.loadRoadmap();
    const feature = this.findFeature(data, featureName);
    
    feature.score += 1;
    this.storage.saveRoadmap(data);
    
    process.stdout.write(`✅ Voted for '${featureName}' (now ${feature.score} votes)\n`);
  }

  add(featureName: string, description: string, why?: string): void {
    const data = this.storage.loadRoadmap();
    
    this.validateFeatureDoesNotExist(data, featureName);
    this.addFeatureToRoadmap(data, featureName, description, why);
    
    this.storage.saveRoadmap(data);
    process.stdout.write(`✅ Added feature '${featureName}' to roadmap\n`);
  }

  remove(featureName: string): void {
    const data = this.storage.loadRoadmap();
    const initialCount = data.features.length;
    
    data.features = data.features.filter(f => f.name !== featureName);
    
    if (data.features.length === initialCount) {
      process.stderr.write(`❌ Feature '${featureName}' not found. Use 'npm run roadmap:status' to see available features.\n`);
      process.exit(1);
    }
    
    this.storage.saveRoadmap(data);
    process.stdout.write(`✅ Removed feature '${featureName}' from roadmap\n`);
  }

  getRoadmapData(): RoadmapData {
    const data = this.storage.loadRoadmap();
    this.removeCompletedFeatures(data);
    return data;
  }

  private removeCompletedFeatures(data: RoadmapData): void {
    const initialCount = data.features.length;
    data.features = data.features.filter(f => f.status !== 'completed');
    
    if (data.features.length < initialCount) {
      this.storage.saveRoadmap(data);
    }
  }

  private findFeature(data: RoadmapData, featureName: string): RoadmapFeature {
    const feature = data.features.find(f => f.name === featureName);
    
    if (!feature) {
      process.stderr.write(`❌ Feature '${featureName}' not found. Use 'npm run roadmap:status' to see available features.\n`);
      process.exit(1);
    }

    return feature;
  }

  private validateFeatureDoesNotExist(data: RoadmapData, featureName: string): void {
    if (data.features.find(f => f.name === featureName)) {
      process.stderr.write(`❌ Feature '${featureName}' already exists.\n`);
      process.exit(1);
    }
  }

  private addFeatureToRoadmap(data: RoadmapData, featureName: string, description: string, why?: string): void {
    data.features.push({
      name: featureName,
      description,
      why,
      score: 0,
      status: 'proposed'
    });
  }
}