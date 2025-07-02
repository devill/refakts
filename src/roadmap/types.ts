export interface RoadmapFeature {
  name: string;
  description: string;
  why?: string;
  score: number;
  status: 'proposed' | 'in-progress' | 'completed';
  tier: number;
  dependencies?: string[];
}

export interface RoadmapData {
  features: RoadmapFeature[];
  lastUpdated: string;
}