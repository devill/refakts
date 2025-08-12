# RefakTS Refactoring Style Guide

This guide defines the refactoring style and principles observed during the find-usages architectural transformation.

## Core Refactoring Philosophy

**CORE APPROACH: "Minimal, surgical, trust the existing systems"** - This is the fundamental approach for all code changes. Avoid over-engineering, unnecessary abstractions, and complex error handling that masks real issues. Let errors bubble up naturally and change only what's broken.

### Key Transformation Patterns

#### From Procedural to Object-Oriented
- **Message-passing over inheritance** - Use composition and delegation rather than complex inheritance hierarchies
- **Single responsibility principle** - Each class and method should have ONE clear job
- **Eliminate feature envy** - Move methods closer to the data they operate on

#### Functional Programming Style
- **Prefer `flatMap` and `filter`** over manual array building and pushing
- **Chain operations** rather than using intermediate variables
- **Use functional composition** to express intent clearly

**Example transformation:**
```typescript
// ❌ BEFORE: Procedural with manual array building
const nodes: Node[] = [];
for (const file of files) {
  const requireNodes = this.findRequireNodes(file, moduleFilePath, symbolName);
  nodes.push(...requireNodes);
  const importNodes = this.findDynamicImportNodes(file, moduleFilePath, symbolName);
  nodes.push(...importNodes);
}
return nodes;

// ✅ AFTER: Functional programming
return this.project.getSourceFiles()
  .flatMap(file => this.findModuleImportsInFile(file, moduleFilePath, symbolName));
```

### Method Extraction Philosophy

#### Explaining Methods Over Explaining Variables
- **Hide complexity behind intention-revealing method names** rather than inline comments or verbose variable names
- **Extract methods that explain the "what"** while keeping the "how" implementation details hidden

**Example:**
```typescript
// ❌ BEFORE: Explaining variable
const lineCount = func.getEndLineNumber() - func.getStartLineNumber() + 1;

// ✅ AFTER: Explaining method
const lineCount = this.getLineCount(func);
```

#### Separate "What" from "How"
- **Coordinate operations at high level** - Let top-level methods orchestrate the flow
- **Delegate implementation details** to focused helper methods
- **Use clear method names** that describe business intent

### Data Structure Preferences

#### Classes Over Interfaces When Appropriate
- **Use classes when you need behavior with data** - Don't over-abstract with interfaces if a class would be clearer
- **Encapsulate related data and operations** in the same class
- **Prefer value objects** for parameter passing over primitive obsession

#### Eliminate Unnecessary Abstractions
- **Remove interfaces that don't add value** - If there's only one implementation, the interface might be premature
- **Remove value objects that just pass data** - If they don't provide validation or behavior, use direct parameters
- **Consolidate duplicate code paths** - Don't abstract until you have at least 3 similar implementations

### Quality-Driven Refactoring

#### Function Size Discipline
- **Keep methods under 12 lines** - Forces proper responsibility separation
- **Extract explaining methods** when logic becomes complex
- **Use early returns** to reduce nesting and improve readability

#### Parameter Count Management
- **Max 3-4 parameters per method** - More suggests the method is doing too much
- **Group related parameters** into cohesive objects when needed
- **Consider if method belongs ON the parameter object** as a class method instead

### Architectural Transformation Strategy

#### Make the Change Easy, Then Make the Easy Change
1. **Identify the design issues** that make the change hard
2. **Refactor to the ideal structure** first
3. **Then implement the feature** in the clean architecture
4. **Example**: Move LocationRange conversions to command level required first extracting reference finding into separate classes

#### Trust the Existing Systems
- **Don't reinvent wheels** - Use existing patterns and infrastructure
- **Build on proven foundations** like ts-morph, existing AST services
- **Let errors bubble up naturally** rather than adding complex error handling

#### Object-Oriented Design Patterns
- **Composition over inheritance** - Build functionality by combining focused objects
- **Strategy pattern** for variations in behavior (like different reference finders)
- **Facade pattern** for simplifying complex subsystems
- **Command pattern** for encapsulating operations

### Common Anti-Patterns to Avoid

#### Fallback Mechanisms
- **Avoid fallback logic** - It usually indicates a design problem
- **Let specific tools do specific jobs** - Don't try to handle all cases in one place
- **Fail fast and clearly** rather than masking issues

#### Premature Abstraction
- **Don't abstract until you have 3+ similar cases**
- **Remove interfaces that don't add value**
- **Keep abstractions close to the concrete use cases**

#### Over-Engineering
- **Don't add complexity for theoretical future needs**
- **Solve today's problems with simple, clear solutions**
- **Refactor when the need actually arises**

## Code Style Preferences

### Import Management
- **Use ES6 imports consistently** - No `require()` statements in TypeScript files
- **Place all imports at the top** - Never inside functions or methods
- **Group imports logically** - External deps, then internal modules

### Error Handling
- **Minimal error handling** - Let errors bubble up naturally
- **Clear error messages** with specific context
- **Fail fast** rather than trying to recover from unclear states

### Naming Conventions
- **Intention-revealing names** that describe the business purpose
- **Avoid technical jargon** in favor of domain language
- **Use verbs for methods, nouns for classes and properties**

### Systematic Refactoring

#### Line-Based Operations
- **Work bottom-up for coordinate-based edits** - Start with highest line numbers to avoid coordinate shifts
- **Example**: When inlining multiple variables, process line 167 before line 94 to maintain stable targets