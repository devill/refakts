#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const JUNK_FILE_PATTERNS = [
    /^(true|false)$/,
    /^--.*$/,
    /^-[a-zA-Z]$/,
    /^(location|target|options?|args?|command|flag|help|version)$/
];

function getStagedFiles(): string[] {
    try {
        const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
        return [];
    }
}

function isJunkFile(filename: string): boolean {
    const basename = filename.split('/').pop() || filename;
    return JUNK_FILE_PATTERNS.some(pattern => pattern.test(basename));
}

function main() {
    const stagedFiles = getStagedFiles();
    const junkFiles = stagedFiles.filter(isJunkFile);
    
    if (junkFiles.length === 0) {
        console.log('✅ No junk files detected');
        process.exit(0);
    }
    
    console.log('❌ Detected potential junk files in commit:');
    junkFiles.forEach(file => console.log(`  - ${file}`));
    console.log('');
    console.log('These files appear to be accidentally created (possibly command-line options/arguments).');
    console.log('Please review and remove them before committing.');
    console.log('');
    console.log('To unstage these files, run:');
    console.log(`  git reset HEAD ${junkFiles.join(' ')}`);
    console.log('');
    process.exit(1);
}

if (require.main === module) {
    main();
}