# Command Implementation Guide

This guide explains how to implement new RefakTS commands based on the architectural patterns established during the find-usages implementation.

## Command Architecture Overview

RefakTS follows a **command-based architecture** with clear separation of concerns:

```
Command (CLI Interface)
    ↓ LocationRange ↔ Node conversions
Service Layer (Domain Logic)  
    ↓ Business operations
Output Handler (Formatting)
    ↓ User presentation
```

## Command Implementation Pattern

### 1. Command Class Structure

```typescript
export class MyCommand implements RefactoringCommand {
  readonly name = 'my-command';
  readonly description = 'What this command does';
  readonly complete = true;
  private consoleOutput!: ConsoleOutput;
  private outputHandler!: MyOutputHandler;

  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    const finalOptions = this.processTarget(targetLocation, options);
    this.validateOptions(finalOptions);
    await this.executeOperation(finalOptions);
  }

  // Implementation details...
}
```

### 2. Responsibility Separation

**Command Level (CLI Interface):**
- **Handle LocationRange ↔ Node conversions** 
- **Coordinate high-level flow**
- **Manage AST service creation**
- **Convert results for output**

**Service Level (Domain Logic):**
- **Pure business logic operations**
- **Work with Node objects directly** 
- **No knowledge of CLI concerns**
- **Focused, single-purpose classes**

**Output Handler (Presentation):**
- **Format results for user consumption**
- **Handle CLI options like `--include-line`**
- **Consistent formatting across commands**

### 3. LocationRange Conversion Pattern

Commands use **single-line conversions** via LocationRange utility methods:

```typescript
private async executeOperation(options: CommandOptions): Promise<void> {
  const location = LocationRange.from(options.location as LocationRange);
  const results = await this.performOperation(location);
  this.outputHandler.outputResults({ 
    results, 
    baseDir: process.cwd(), 
    targetLocation: location, 
    options 
  });
}

private async performOperation(location: LocationRange): Promise<MyResult[]> {
  try {
    const targetNode = location.getNode(); // Single line: LocationRange → Node
    const astService = ASTService.createForFile(location.file);
    
    return new MyDomainService(astService.getProject())
      .performBusinessLogic(targetNode)
      .map(node => PositionConverter.createUsageLocation(node.getSourceFile(), node)); // Single line: Node → UsageLocation
  } catch (error) {
    return this.handleError(error);
  }
}
```

**Key Conversions:**
- **LocationRange → Node**: `location.getNode()` - handles AST service creation, validation, and node extraction
- **Node → UsageLocation**: `PositionConverter.createUsageLocation(node.getSourceFile(), node)` - creates properly formatted output

### 4. Service Layer Design

**Functional Programming Style:**
```typescript
export class MyDomainService {
  constructor(private project: Project) {}

  performBusinessLogic(targetNode: Node): Node[] {
    return this.project.getSourceFiles()
      .flatMap(file => this.processFile(file, targetNode))
      .filter(result => this.isValidResult(result));
  }

  private processFile(file: SourceFile, targetNode: Node): Node[] {
    return file.getDescendantsOfKind(SyntaxKind.SomeKind)
      .filter(node => this.matchesCriteria(node, targetNode))
      .flatMap(node => this.extractResults(node));
  }
}
```

### 5. Output Handler Integration

**Use Existing Output Handlers:**
```typescript
// ✅ GOOD: Leverage existing infrastructure
class MyCommand {
  private outputHandler = new SelectOutputHandler();
  
  private async executeOperation(options: CommandOptions): Promise<void> {
    const results = await this.findResults(location);
    const selectResults = results.map(r => this.convertToSelectResult(r));
    this.outputHandler.outputResults(selectResults);
  }
}
```

**Create New Output Handler When Needed:**
```typescript
export class MyOutputHandler {
  constructor(private consoleOutput: ConsoleOutput) {}

  outputResults(context: MyOutputContext): void {
    // Convert to SelectResult[] if possible for consistency
    const selectResults = context.results.map(r => this.toSelectResult(r));
    new SelectOutputHandler(this.consoleOutput).outputResults(selectResults);
  }
}
```

## Implementation Workflow

### 1. Design Phase
1. **Understand the domain operation** - What business logic needs to happen?
2. **Identify input/output** - What LocationRange inputs, what results outputs?
3. **Plan service layer** - What domain services will perform the core logic?
4. **Consider output format** - Can you reuse existing output handlers?

### 2. Test-Driven Implementation
1. **Create fixture tests** in `tests/fixtures/commands/my-command/`
2. **Start with failing tests** to understand expected behavior
3. **Implement command structure** with stubs
4. **Implement service layer** with business logic
5. **Wire up output handling**

### 3. Service Layer Guidelines

**Single Responsibility:**
```typescript
// ✅ GOOD: Each service has one clear job
class SymbolFinder {
  findSymbols(targetNode: Node): Node[] { /* ... */ }
}

class UsageFinder {
  findUsages(symbols: Node[]): Node[] { /* ... */ }
}

// ❌ BAD: Mixed responsibilities
class SymbolAndUsageFinder {
  findSymbolsAndUsages(targetNode: Node): Node[] { /* mixed logic */ }
}
```

**Functional Programming:**
```typescript
// ✅ GOOD: Functional composition
return this.getTargetFiles()
  .flatMap(file => this.findCandidatesInFile(file))
  .filter(candidate => this.matchesCriteria(candidate))
  .map(candidate => this.extractResult(candidate));

// ❌ BAD: Procedural array building
const results: Node[] = [];
for (const file of this.getTargetFiles()) {
  const candidates = this.findCandidatesInFile(file);
  for (const candidate of candidates) {
    if (this.matchesCriteria(candidate)) {
      results.push(this.extractResult(candidate));
    }
  }
}
```

### 4. Error Handling Strategy

**Command Level - Handle User-Facing Errors:**
```typescript
private async performOperation(location: LocationRange): Promise<MyResult[]> {
  try {
    // ... business logic
  } catch (error) {
    return this.handleUserError(error);
  }
}

private handleUserError(error: unknown): MyResult[] {
  if (error instanceof Error && error.message.includes('No symbol found')) {
    return []; // Graceful degradation for user
  }
  throw error; // Let unexpected errors bubble up
}
```

**Service Level - Let Errors Bubble:**
```typescript
// ✅ GOOD: Let business logic errors propagate
class MyService {
  performOperation(node: Node): Result[] {
    if (!node.getSymbol()) {
      throw new Error('No symbol found at location'); // Will be caught at command level
    }
    // ... continue with business logic
  }
}
```

## Testing Strategy

### Fixture Tests for End-to-End Validation
```
tests/fixtures/commands/my-command/
├── basic-operation/
│   ├── fixture.config.json
│   ├── input/main.ts
│   └── basic-operation.expected.out
├── edge-case/
└── error-handling/
```

### Unit Tests for Service Logic
```typescript
describe('MyDomainService', () => {
  it('should find relevant nodes', () => {
    const service = new MyDomainService(project);
    const results = service.performBusinessLogic(targetNode);
    
    verify(__dirname, 'finds-nodes', results, { reporters: ['donothing'] });
  });
});
```

## Common Patterns

### Multi-Step Processing
```typescript
private async performComplexOperation(location: LocationRange): Promise<Result[]> {
  const targetNode = location.getNode(); // Single line conversion
  const astService = ASTService.createForFile(location.file);
  
  // Step 1: Find candidates
  const candidates = new CandidateFinder(astService.getProject())
    .findCandidates(targetNode);
    
  // Step 2: Filter and transform
  const validCandidates = new CandidateValidator()
    .validateCandidates(candidates);
    
  // Step 3: Extract results
  return validCandidates.map(candidate => 
    PositionConverter.createUsageLocation(candidate.getSourceFile(), candidate) // Single line conversion
  );
}
```

### Reusing Cross-File Logic
```typescript
// ✅ GOOD: Reuse established patterns
const referenceFinder = new CrossFileReferenceFinder(project);
const relatedNodes = referenceFinder.findAllReferences(targetNode);

// Then apply your specific business logic to the related nodes
return relatedNodes
  .filter(node => this.matchesMySpecificCriteria(node))
  .map(node => this.transformForMyUseCase(node));
```

This approach builds on proven infrastructure while keeping your command focused on its specific domain logic.