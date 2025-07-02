import * as fs from 'fs';
import * as path from 'path';
import { RoadmapData, RoadmapFeature } from './types';

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
      features: this.getDefaultFeatures(),
      lastUpdated: new Date().toISOString()
    };
  }

  private getDefaultFeatures(): RoadmapFeature[] {
    return [
      { name: 'regex-ast-locator', description: 'Find AST nodes by text content', score: 0, status: 'proposed', tier: 1 },
      { name: 'selection-tool', description: 'Select AST ranges between two points', score: 0, status: 'proposed', tier: 1, dependencies: ['regex-ast-locator'] },
      { name: 'function-body-extractor', description: 'Get function body without reading entire files', score: 0, status: 'proposed', tier: 1, dependencies: ['regex-ast-locator'] },
      { name: 'complete-ast-query-engine', description: 'Complete node-finding-command', score: 0, status: 'in-progress', tier: 1 },
      { name: 'smart-method-extraction', description: 'Extract methods with automatic parameter detection', score: 0, status: 'proposed', tier: 2, dependencies: ['selection-tool', 'complete-ast-query-engine'] },
      { name: 'automated-dead-code-elimination', description: 'Safe removal of unused code', score: 0, status: 'proposed', tier: 2, dependencies: ['complete-ast-query-engine'] }
    ];
  }
}