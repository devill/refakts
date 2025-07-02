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
    console.log('\n📊 No usage data available yet');
    return;
  }
  
  const hasSessionUsage = Object.keys(stats.sessionCounts).length > 0;
  const hasTotalUsage = Object.keys(stats.commandCounts).length > 0;
  
  if (!hasSessionUsage && !hasTotalUsage) {
    console.log('\n📊 No refakts commands used yet');
    return;
  }
  
  console.log('\n📊 RefakTS Usage Report');
  console.log('========================');
  
  if (hasSessionUsage) {
    console.log('\n🔄 This Session:');
    for (const [command, count] of Object.entries(stats.sessionCounts)) {
      console.log(`  ${command}: ${count}`);
    }
  } else {
    console.log('\n🔄 This Session: No commands used');
  }
  
  if (hasTotalUsage) {
    console.log('\n📈 Total Usage:');
    for (const [command, count] of Object.entries(stats.commandCounts)) {
      console.log(`  ${command}: ${count}`);
    }
  }
  
  console.log(`\n⏰ Last updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
  console.log('');
}

if (require.main === module) {
  main();
}