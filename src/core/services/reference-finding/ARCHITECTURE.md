# Reference Finding Architecture

This document describes the architecture of the reference finding system, transformed from a procedural monolith to clean object-oriented design.

## Architecture Overview

The reference finding system uses a **composition-based architecture** with three specialized components:

```
CrossFileReferenceFinder (Coordinator)
├── SemanticReferenceFinder (TypeScript Language Service)
├── ModuleImportReferenceFinder (CommonJS/Dynamic Imports)
└── Node deduplication and result merging
```

## Core Classes

### CrossFileReferenceFinder
**Role**: Coordinator that combines semantic and module import analysis

**Key Responsibilities**:
- Orchestrate multiple reference finding strategies
- Deduplicate results from different finders
- Provide unified interface for command layer

**Implementation Pattern**:
```typescript
findAllReferences(targetNode: Node): Node[] {
  return this.deduplicateNodes([
    ...(this.semanticFinder.findReferences(targetNode)),
    ...(this.moduleImportFinder.findReferences(targetNode))
  ]);
}
```

### SemanticReferenceFinder
**Role**: Handle standard TypeScript semantic analysis

**Key Responsibilities**:
- Use TypeScript language service for symbol resolution
- Find ES6 import/export references
- Handle standard variable and function references

**Implementation Pattern**:
```typescript
findReferences(targetNode: Node): Node[] {
  return this.project
    .getLanguageService()
    .findReferences(targetNode)
    .flatMap(referencedSymbol => this.findReferencesFor(referencedSymbol));
}
```

### ModuleImportReferenceFinder
**Role**: Handle CommonJS require() and dynamic import() calls that language service misses

**Key Responsibilities**:
- Detect CommonJS `require()` calls
- Find dynamic `import()` expressions
- Analyze destructuring patterns
- Track local variable usage

**Implementation Pattern**:
```typescript
findReferences(targetNode: Node): Node[] {
  return this.project.getSourceFiles()
    .flatMap(file => this.findModuleImportsInFile(file, moduleFilePath, symbolName));
}
```

## Architectural Principles

### Composition Over Inheritance
- **Why**: Different reference finding strategies have distinct algorithms
- **How**: CrossFileReferenceFinder composes specialized finders rather than inheriting behavior
- **Benefit**: Easy to add new reference finding strategies without modifying existing code

### Functional Programming Style
- **Pattern**: Use `flatMap`, `filter`, and `map` instead of manual array building
- **Benefit**: More concise, less error-prone, easier to reason about
- **Example**: Replace procedural loops with functional composition

### Single Responsibility Principle
- **SemanticReferenceFinder**: Only TypeScript language service logic
- **ModuleImportReferenceFinder**: Only CommonJS/dynamic import logic  
- **CrossFileReferenceFinder**: Only coordination and deduplication
- **Benefit**: Each class is focused, testable, and maintainable

### Message Passing Architecture
- **Pattern**: Objects send messages to each other rather than sharing state
- **Implementation**: Each finder receives Node input, returns Node[] output
- **Benefit**: Clear interfaces, minimal coupling, easy to test

## Key Design Decisions

### Node-Based Interface
**Decision**: All reference finders work with ts-morph Node objects

**Rationale**:
- LocationRange conversion happens at command level
- Services focus on domain logic without CLI concerns
- Easier to compose and test service operations

### No Fallback Mechanisms
**Decision**: Removed fallback logic between semantic and module import finding

**Rationale**:
- Fallbacks usually indicate design problems
- Each finder has specific, non-overlapping responsibilities
- Cleaner error handling and debugging

### Functional Composition
**Decision**: Use functional programming patterns throughout

**Rationale**:
- Eliminates manual array building and mutation
- More concise and readable code
- Fewer opportunities for bugs (off-by-one, forgotten pushes, etc.)

## Extension Points

### Adding New Reference Finding Strategies
```typescript
// 1. Create specialized finder
class MyNewReferenceFinder {
  findReferences(targetNode: Node): Node[] {
    // Your specific logic here
  }
}

// 2. Add to CrossFileReferenceFinder
constructor(private project: Project) {
  this.semanticFinder = new SemanticReferenceFinder(project);
  this.moduleImportFinder = new ModuleImportReferenceFinder(project);
  this.myNewFinder = new MyNewReferenceFinder(project); // Add here
}

findAllReferences(targetNode: Node): Node[] {
  return this.deduplicateNodes([
    ...(this.semanticFinder.findReferences(targetNode)),
    ...(this.moduleImportFinder.findReferences(targetNode)),
    ...(this.myNewFinder.findReferences(targetNode)) // Add here
  ]);
}
```

### Customizing Module Import Detection
The `ModuleImportReferenceFinder` can be extended for new module patterns:

```typescript
private findModuleCalls(file: SourceFile): CallExpression[] {
  return file.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => this.isModuleCall(call));
}

private isModuleCall(call: CallExpression): boolean {
  // Add new patterns here
  const expression = call.getExpression();
  return this.isRequireCall(expression) || 
         this.isDynamicImport(expression) ||
         this.isYourCustomPattern(expression);
}
```

## Performance Characteristics

### SemanticReferenceFinder
- **Fast**: Leverages TypeScript's optimized language service
- **Comprehensive**: Finds all standard TypeScript references
- **Limitation**: Misses dynamic/runtime module patterns

### ModuleImportReferenceFinder  
- **Slower**: Requires full AST traversal of all files
- **Specialized**: Catches edge cases missed by language service
- **Focused**: Only handles specific module import patterns

### CrossFileReferenceFinder
- **Balanced**: Combines speed of semantic analysis with completeness of module analysis
- **Efficient**: Deduplication ensures no duplicate processing of same references

## Testing Strategy

### Unit Testing Individual Finders
```typescript
describe('SemanticReferenceFinder', () => {
  it('should find standard references', () => {
    const finder = new SemanticReferenceFinder(project);
    const results = finder.findReferences(targetNode);
    expect(results).toHaveLength(expectedCount);
  });
});
```

### Integration Testing via CrossFileReferenceFinder
```typescript
describe('CrossFileReferenceFinder', () => {
  it('should combine all reference types', () => {
    const finder = new CrossFileReferenceFinder(project);
    const results = finder.findAllReferences(targetNode);
    // Results should include both semantic and module import references
  });
});
```

### Fixture Testing for Real-World Scenarios
- Use `tests/fixtures/commands/find-usages/` for end-to-end validation
- Test complex scenarios with multiple files and module patterns
- Verify output format and edge cases