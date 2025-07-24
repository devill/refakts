#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface FileMove {
  originalPath: string;
  newPath: string;
  isCompleted: boolean;
  lineNumber: number;
  fullLine: string;
}

class ChecklistVerifier {
  private srcDir = path.join(__dirname, 'src');
  private checklistPath = path.join(__dirname, 'REORGANIZATION_CHECKLIST.md');

  async verifyChecklist(): Promise<void> {
    console.log('🔍 Verifying REORGANIZATION_CHECKLIST.md against actual file locations...\n');
    
    const moves = this.parseChecklist();
    let correctionsMade = 0;
    let totalFiles = 0;
    let completedFiles = 0;
    
    const updatedLines: string[] = [];
    const checklistContent = fs.readFileSync(this.checklistPath, 'utf-8');
    const lines = checklistContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const move = moves.find(m => m.lineNumber === i);
      
      if (move) {
        totalFiles++;
        const actualStatus = this.checkFileLocation(move);
        
        if (actualStatus !== move.isCompleted) {
          correctionsMade++;
          const newLine = this.updateLineStatus(line, actualStatus);
          updatedLines.push(newLine);
          
          console.log(`${actualStatus ? '✅ CORRECTED' : '❌ CORRECTED'}: ${move.originalPath} → ${move.newPath}`);
          console.log(`   Was marked: ${move.isCompleted ? 'completed' : 'pending'}`);
          console.log(`   Actually is: ${actualStatus ? 'completed' : 'pending'}`);
          console.log('');
        } else {
          updatedLines.push(line);
          if (actualStatus) completedFiles++;
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    // Update progress counts
    const progressPercentage = totalFiles > 0 ? ((completedFiles / totalFiles) * 100).toFixed(1) : '0.0';
    const remainingFiles = totalFiles - completedFiles;
    
    for (let i = 0; i < updatedLines.length; i++) {
      if (updatedLines[i].includes('**Completed:**') && updatedLines[i].includes('files ✅')) {
        updatedLines[i] = `**Completed:** ${completedFiles} files ✅ (${progressPercentage}%)`;
      }
      if (updatedLines[i].includes('**Remaining:**') && updatedLines[i].includes('files')) {
        updatedLines[i] = `**Remaining:** ${remainingFiles} files`;
      }
    }
    
    if (correctionsMade > 0) {
      fs.writeFileSync(this.checklistPath, updatedLines.join('\n'));
      console.log(`📝 Made ${correctionsMade} corrections to the checklist`);
    } else {
      console.log('✅ Checklist is accurate - no corrections needed');
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total files: ${totalFiles}`);
    console.log(`   Completed: ${completedFiles} (${progressPercentage}%)`);
    console.log(`   Remaining: ${remainingFiles}`);
    console.log(`   Corrections made: ${correctionsMade}`);
  }

  private parseChecklist(): FileMove[] {
    const content = fs.readFileSync(this.checklistPath, 'utf-8');
    const lines = content.split('\n');
    const moves: FileMove[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^- \[([ x])\] `([^`]+)` → `([^`]+)`/);
      
      if (match) {
        const [, checkbox, originalPath, newPath] = match;
        moves.push({
          originalPath: originalPath.trim(),
          newPath: newPath.trim(),
          isCompleted: checkbox === 'x',
          lineNumber: i,
          fullLine: line
        });
      }
    }
    
    return moves;
  }

  private checkFileLocation(move: FileMove): boolean {
    const originalFullPath = path.join(this.srcDir, move.originalPath);
    const newFullPath = path.join(this.srcDir, move.newPath);
    
    const originalExists = fs.existsSync(originalFullPath);
    const newExists = fs.existsSync(newFullPath);
    
    // File is considered "completed" if it exists in the new location and not in the old location
    // OR if it exists in both locations (might be a copy scenario)
    // It's "pending" if it only exists in the original location
    
    if (newExists && !originalExists) {
      return true; // Moved successfully
    }
    
    if (newExists && originalExists) {
      // Both exist - check modification times to see which is more recent
      const originalStat = fs.statSync(originalFullPath);
      const newStat = fs.statSync(newFullPath);
      
      // If new file is more recent, consider it moved
      return newStat.mtime >= originalStat.mtime;
    }
    
    if (!newExists && originalExists) {
      return false; // Not moved yet
    }
    
    if (!newExists && !originalExists) {
      // Neither exists - this might be a deleted file or wrong path
      console.log(`⚠️  WARNING: Neither ${move.originalPath} nor ${move.newPath} exists`);
      return false;
    }
    
    return false;
  }

  private updateLineStatus(line: string, isCompleted: boolean): string {
    const checkbox = isCompleted ? 'x' : ' ';
    const suffix = isCompleted ? ' ✅' : '';
    
    // Remove existing checkmark if present
    let updatedLine = line.replace(/ ✅$/, '');
    
    // Update checkbox
    updatedLine = updatedLine.replace(/^- \[([ x])\]/, `- [${checkbox}]`);
    
    // Add checkmark if completed
    if (isCompleted && !updatedLine.includes('✅')) {
      updatedLine += suffix;
    }
    
    return updatedLine;
  }
}

// Run the verifier
if (require.main === module) {
  const verifier = new ChecklistVerifier();
  verifier.verifyChecklist().catch(console.error);
}