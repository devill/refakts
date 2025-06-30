import * as fs from 'fs';
import * as path from 'path';

const SNOOZE_FILE_PATH = path.join(__dirname, '..', '..', '.quality-snooze.json');
const SNOOZE_DURATION_HOURS = 24;

interface SnoozeRecord {
  [checkType: string]: {
    [identifier: string]: number;
  };
}

export function isCheckSnoozed(checkType: string, identifier: string): boolean {
  const snoozeData = loadSnoozeData();
  const checkSnoozes = snoozeData[checkType];
  
  return validateSnoozeStatus(checkSnoozes, identifier);
}

function validateSnoozeStatus(checkSnoozes: any, identifier: string): boolean {
  if (!hasActiveSnooze(checkSnoozes, identifier)) {
    return false;
  }
  
  const snoozeTimestamp = checkSnoozes[identifier];
  return isSnoozeStillValid(snoozeTimestamp);
}

function hasActiveSnooze(checkSnoozes: any, identifier: string): boolean {
  return checkSnoozes && checkSnoozes[identifier];
}

function isSnoozeStillValid(snoozeTimestamp: number): boolean {
  const currentTime = Date.now();
  const hoursElapsed = (currentTime - snoozeTimestamp) / (1000 * 60 * 60);
  return hoursElapsed < SNOOZE_DURATION_HOURS;
}

export function snoozeCheck(checkType: string, identifier: string): void {
  const snoozeData = loadSnoozeData();
  
  if (!snoozeData[checkType]) {
    snoozeData[checkType] = {};
  }
  
  snoozeData[checkType][identifier] = Date.now();
  saveSnoozeData(snoozeData);
}

export function clearExpiredSnoozes(): void {
  const snoozeData = loadSnoozeData();
  const hasChanges = removeExpiredSnoozes(snoozeData);
  
  if (hasChanges) {
    saveSnoozeData(snoozeData);
  }
}

function removeExpiredSnoozes(snoozeData: SnoozeRecord): boolean {
  let hasChanges = false;
  
  for (const checkType in snoozeData) {
    hasChanges = cleanupCheckType(snoozeData, checkType) || hasChanges;
  }
  
  return hasChanges;
}

function cleanupCheckType(snoozeData: SnoozeRecord, checkType: string): boolean {
  const hasChanges = removeExpiredIdentifiers(snoozeData, checkType);
  return cleanupEmptyCheckType(snoozeData, checkType) || hasChanges;
}

function removeExpiredIdentifiers(snoozeData: SnoozeRecord, checkType: string): boolean {
  let hasChanges = false;
  
  hasChanges = processIdentifiersForExpiration(snoozeData, checkType, hasChanges);
  return hasChanges;
}

function processIdentifiersForExpiration(snoozeData: SnoozeRecord, checkType: string, hasChanges: boolean): boolean {
  for (const identifier in snoozeData[checkType]) {
    if (isSnoozeExpired(snoozeData[checkType][identifier])) {
      delete snoozeData[checkType][identifier];
      hasChanges = true;
    }
  }
  return hasChanges;
}

function isSnoozeExpired(snoozeTimestamp: number): boolean {
  return !isSnoozeStillValid(snoozeTimestamp);
}

function cleanupEmptyCheckType(snoozeData: SnoozeRecord, checkType: string): boolean {
  if (Object.keys(snoozeData[checkType]).length === 0) {
    delete snoozeData[checkType];
    return true;
  }
  return false;
}

function loadSnoozeData(): SnoozeRecord {
  return readSnoozeFile();
}

function readSnoozeFile(): SnoozeRecord {
  try {
    return attemptFileRead();
  } catch (error) {
    console.warn('Failed to load snooze data:', error);
    return {};
  }
}

function attemptFileRead(): SnoozeRecord {
  if (fs.existsSync(SNOOZE_FILE_PATH)) {
    const data = fs.readFileSync(SNOOZE_FILE_PATH, 'utf8');
    return JSON.parse(data);
  }
  return {};
}

function saveSnoozeData(data: SnoozeRecord): void {
  try {
    fs.writeFileSync(SNOOZE_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Failed to save snooze data:', error);
  }
}