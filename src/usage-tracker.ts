import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface UsageEntry {
  command: string;
  timestamp: string;
  args: string[];
}

export class UsageTracker {
  private static readonly LOG_FILE = path.join(os.homedir(), '.refakts-usage.jsonl');

  static logUsage(command: string, args: string[]): void {
    const entry: UsageEntry = {
      command,
      timestamp: new Date().toISOString(),
      args: args.filter(arg => !arg.includes('/') && !path.isAbsolute(arg)) // Filter out file paths for privacy
    };

    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.LOG_FILE, logLine);
    } catch (error) {
      // Silently fail - we don't want usage tracking to break functionality
    }
  }

  static getUsageLog(): UsageEntry[] {
    try {
      if (!fs.existsSync(this.LOG_FILE)) {
        return [];
      }
      
      const content = fs.readFileSync(this.LOG_FILE, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  static getUsageCounts(): Record<string, number> {
    const entries = this.getUsageLog();
    const counts: Record<string, number> = {};
    
    for (const entry of entries) {
      counts[entry.command] = (counts[entry.command] || 0) + 1;
    }
    
    return counts;
  }

  static clearUsageLog(): void {
    try {
      if (fs.existsSync(this.LOG_FILE)) {
        fs.unlinkSync(this.LOG_FILE);
      }
    } catch (error) {
      // Silently fail
    }
  }
}