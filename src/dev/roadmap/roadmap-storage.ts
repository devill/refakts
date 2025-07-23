import * as fs from 'fs';
import * as path from 'path';
import { RoadmapData } from '../../roadmap/types';

export class RoadmapStorage {
  private roadmapFile = path.join(process.cwd(), 'roadmap-data.json');

  loadRoadmap(): RoadmapData {
    if (!fs.existsSync(this.roadmapFile)) {
      return this.createDefaultRoadmap();
    }
    
    return JSON.parse(fs.readFileSync(this.roadmapFile, 'utf8'));
  }

  saveRoadmap(data: RoadmapData): void {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.roadmapFile, JSON.stringify(data, null, 2));
  }

  private createDefaultRoadmap(): RoadmapData {
    return {
      features: [],
      lastUpdated: new Date().toISOString()
    };
  }
}