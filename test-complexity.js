const escomplex = require('typhonjs-escomplex');
const fs = require('fs');

// Test with a TypeScript file
const source = fs.readFileSync('src/commands/extract-variable-command.ts', 'utf8');
const report = escomplex.analyzeModule(source);

console.log('Module report:');
console.log('- Aggregate params:', report.aggregate.params);
console.log('- Cyclomatic complexity:', report.aggregate.cyclomatic);
console.log('- Functions with params > 3:');

report.methods.forEach(method => {
  if (method.params > 3) {
    console.log(`  - ${method.name}: ${method.params} params (line ${method.line})`);
  }
});