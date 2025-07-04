#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface UsageStats {
  lastUpdated: string;
  commandCounts: Record<string, number>;
  sessionCounts: Record<string, number>;
}

const STATS_FILE = path.join(__dirname, '..', '.refakts-stats.json');

function loadStats(): UsageStats | null {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

function main(): void {
  const stats = loadStats();
  
  if (!stats) {
    process.stdout.write('\n📊 No usage data available yet\n');
    return;
  }
  
  const hasSessionUsage = Object.keys(stats.sessionCounts).length > 0;
  const hasTotalUsage = Object.keys(stats.commandCounts).length > 0;
  
  if (!hasSessionUsage && !hasTotalUsage) {
    process.stdout.write('\n📊 No refakts commands used yet\n');
    return;
  }
  
  process.stdout.write('\n📊 RefakTS Usage Report\n');
  process.stdout.write('========================\n');
  
  if (hasSessionUsage) {
    process.stdout.write('\n🔄 This Session:\n');
    for (const [command, count] of Object.entries(stats.sessionCounts)) {
      process.stdout.write(`  ${command}: ${count}\n`);
    }
  } else {
    process.stdout.write('\n🔄 This Session: No commands used\n');
  }
  
  if (hasTotalUsage) {
    process.stdout.write('\n📈 Total Usage:\n');
    for (const [command, count] of Object.entries(stats.commandCounts)) {
      process.stdout.write(`  ${command}: ${count}\n`);
    }
  }
  
  process.stdout.write(`\n⏰ Last updated: ${new Date(stats.lastUpdated).toLocaleString()}\n`);
  process.stdout.write('\n');
}

if (require.main === module) {
  main();
}