#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const getToleranceFilePath = (): string => {
  return path.join(process.cwd(), '.linter-tolerance');
};

const getHoursSinceStart = (startTime: number): number => {
  return Math.floor((Date.now() - startTime) / (1000 * 60 * 60));
};

const getCurrentTolerance = (): { tolerance: number; hoursPassed: number; initialCount: number; startTime: number } => {
  const toleranceFile = getToleranceFilePath();
  
  if (!fs.existsSync(toleranceFile)) {
    console.log('⚠️ No tolerance tracking file found. Run `npm run quality` first to initialize.');
    process.exit(1);
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(toleranceFile, 'utf8'));
    const hoursPassed = getHoursSinceStart(data.startTime);
    const currentTolerance = Math.max(0, data.initialCount - hoursPassed);
    
    return {
      tolerance: currentTolerance,
      hoursPassed,
      initialCount: data.initialCount,
      startTime: data.startTime
    };
  } catch (error) {
    console.log('❌ Error reading tolerance file:', error);
    process.exit(1);
  }
};

const main = (): void => {
  const { tolerance, hoursPassed, initialCount, startTime } = getCurrentTolerance();
  const startDate = new Date(startTime);
  
  console.log('📊 Linter Tolerance Status');
  console.log('─'.repeat(30));
  console.log(`Current tolerance: ${tolerance} violations`);
  console.log(`Initial count: ${initialCount} violations`);
  console.log(`Hours passed: ${hoursPassed}`);
  console.log(`Started: ${startDate.toLocaleString()}`);
  console.log(`Progress: ${initialCount - tolerance}/${initialCount} violations eliminated`);
  
  if (tolerance > 0) {
    console.log(`\n⏰ Next reduction in: ${60 - new Date().getMinutes()} minutes`);
    console.log(`🎯 Zero tolerance ETA: ${tolerance} hours`);
  } else {
    console.log(`\n🎉 Zero tolerance achieved! All linter violations must be fixed.`);
  }
};

if (require.main === module) {
  main();
}