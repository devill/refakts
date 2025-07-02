#!/usr/bin/env ts-node

import { UsageTracker } from '../src/usage-tracker';
import * as fs from 'fs';
import * as path from 'path';

interface UsageStats {
  lastUpdated: string;
  commandCounts: Record<string, number>;
  sessionCounts: Record<string, number>;
}

const STATS_FILE = path.join(__dirname, '..', '.refakts-stats.json');

function loadStats(): UsageStats {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
  } catch (error) {
    // Ignore errors, use defaults
  }
  
  return {
    lastUpdated: new Date().toISOString(),
    commandCounts: {},
    sessionCounts: {}
  };
}

function saveStats(stats: UsageStats): void {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function main(): void {
  const stats = loadStats();
  const currentCounts = UsageTracker.getUsageCounts();
  
  // Calculate session counts (new usage since last update)
  const sessionCounts: Record<string, number> = {};
  for (const [command, count] of Object.entries(currentCounts)) {
    const previousCount = stats.commandCounts[command] || 0;
    const sessionCount = count - previousCount;
    if (sessionCount > 0) {
      sessionCounts[command] = sessionCount;
    }
  }
  
  // Update total counts
  stats.commandCounts = currentCounts;
  stats.sessionCounts = sessionCounts;
  stats.lastUpdated = new Date().toISOString();
  
  saveStats(stats);
  
  console.log('Usage stats updated:', {
    sessionCounts,
    totalCounts: stats.commandCounts
  });
}

if (require.main === module) {
  main();
}