const fs = require('fs');

// Test the regex patterns
const content = fs.readFileSync('/Users/ivett/Documents/git/refakts/tests/fixtures/select/edge-cases/multiline-matches.input.ts', 'utf8');
console.log('File content:');
console.log(content);
console.log('\n=== Testing patterns ===');

const patterns = [
  'function.*\\{[\\s\\S]*?\\}',
  'function.*\\\\{[\\\\s\\\\S]*?\\\\}',
  'function.*{[\\s\\S]*?}'
];

patterns.forEach((pattern, i) => {
  console.log(`Pattern ${i}: "${pattern}"`);
  try {
    const regex = new RegExp(pattern, 'g');
    console.log('  Regex source:', regex.source);
    const matches = content.match(regex);
    console.log('  Matches:', matches ? matches.length : 0);
    if (matches) {
      matches.forEach((match, j) => {
        console.log(`    Match ${j}: "${match.substring(0, 50)}..."`);
      });
    }
  } catch (error) {
    console.log('  Error:', error.message);
  }
  console.log('');
});