# Fixture Testing Strategy for Refactoring Tools

This document provides a comprehensive guide for implementing fixture-based integration tests for refactoring tools, based on the successful architecture used in RefakTS (a TypeScript refactoring tool). This strategy is particularly valuable for C# refactoring tools and other language-specific refactoring systems.

## Overview

Fixture testing provides a robust, maintainable approach to testing refactoring operations by using real code samples as test inputs and comparing actual outputs against expected results. This approach ensures refactoring tools work correctly across diverse code patterns and edge cases.

## Core Architecture

### Test Structure Hierarchy

```
tests/
├── integration/
│   └── fixture.test.ts                    # Main test runner
├── fixtures/
│   └── commands/
│       └── [command-name]/
│           ├── [test-case].input.ts       # Single-file tests
│           ├── [test-case].expected.ts    # Expected transformation
│           ├── [test-case].expected.out   # Expected console output
│           ├── [test-case].expected.err   # Expected error output
│           └── multi-file-tests/
│               ├── fixture.config.json   # Test configuration
│               ├── input/                # Input project directory
│               └── [test-id].expected/   # Expected project state
├── utils/                               # Test infrastructure
└── scripts/                            # Test management tools
```

### Key Components

1. **Test Runner** (`fixture.test.ts`) - Orchestrates test execution
2. **Test Case Loader** - Discovers and parses test configurations
3. **Fixture Validators** - Validates single-file and multi-file tests
4. **Command Executor** - Runs refactoring commands safely
5. **File Comparison Engine** - Compares expected vs actual results

## Implementation Strategy

### 1. Test Discovery and Loading

```typescript
// Scans fixture directories to find test cases
function getTestCases(fixturesDir: string, expectedExtension: string): TestCase[] {
  const scanner = new FileSystemScanner();
  if (!scanner.directoryExists(fixturesDir)) {
    return [];
  }
  return loadTestCasesBasedOnExtension(fixturesDir, expectedExtension, scanner);
}
```

**Key Features:**
- Automatic test discovery by file naming convention
- Support for both single-file and multi-file test scenarios
- Hierarchical organization by command type

### 2. Test Case Types

#### Single-File Tests
Perfect for simple refactoring operations within a single file.

**Naming Convention:**
- `simple-rename.input.ts` - Input code
- `simple-rename.expected.ts` - Expected transformed code
- `simple-rename.expected.out` - Expected console output
- `simple-rename.expected.err` - Expected error messages

#### Multi-File Tests
Essential for refactoring operations affecting multiple files (e.g., file moves, cross-file renames).

**Structure:**
```
move-class-test/
├── fixture.config.json       # Configuration and test definitions
├── input/                   # Input project
│   ├── src/models/user.ts
│   ├── src/services/api.ts
│   └── tsconfig.json
└── move-class.expected/     # Expected result
    ├── src/entities/user.ts
    └── src/services/api.ts
```

### 3. Configuration System

#### Single-File Configuration
Embedded in test file names and optional metadata comments.

#### Multi-File Configuration (`fixture.config.json`)
```json
[
  {
    "id": "move-class-to-entities",
    "description": "Move User class from models to entities directory",
    "command": "move-file 'src/models/user.ts' --destination 'src/entities/user.ts'",
    "skip": false
  }
]
```

**Configuration Features:**
- Multiple test cases per project
- Descriptive test names and documentation
- Conditional test skipping
- Command parameterization

### 4. Test Execution Pipeline

#### Single-File Test Flow
1. **Setup Phase:**
   - Copy input file to temporary location
   - Prepare command with file path substitution

2. **Execution Phase:**
   - Run refactoring command against temporary file
   - Capture stdout, stderr, and file transformations

3. **Validation Phase:**
   - Compare transformed file against expected result
   - Validate console output and error messages
   - Normalize paths for cross-platform compatibility

4. **Cleanup Phase:**
   - Remove temporary files on success
   - Preserve files on failure for debugging

#### Multi-File Test Flow
1. **Project Setup:**
   - Create temporary project directory
   - Copy entire input project structure
   - Preserve TypeScript/language configuration files

2. **Command Execution:**
   - Execute command within project context
   - Handle relative path resolution
   - Maintain project integrity

3. **Comprehensive Validation:**
   - Compare entire project structure
   - Validate file transformations across multiple files
   - Check import/reference updates
   - Verify build system compatibility

4. **Cleanup:**
   - Remove temporary project on success
   - Preserve for debugging on failure

### 5. Validation Engine

#### File Content Comparison
```typescript
static compareFileContents(expectedFile: string, receivedFile: string): void {
  const { normalizedExpected, normalizedReceived } = 
    TestUtilities.readAndNormalizeFiles(expectedFile, receivedFile);
  
  if (normalizedReceived !== normalizedExpected) {
    throw TestUtilities.createMismatchError(
      receivedFile, normalizedExpected, normalizedReceived
    );
  }
}
```

**Validation Features:**
- Path normalization for cross-platform compatibility
- Whitespace and formatting tolerance options
- Detailed diff reporting for failures
- Support for partial file matching

#### Output Validation
- **Console Output:** Validate command success/failure messages
- **Error Handling:** Verify appropriate error messages for invalid operations  
- **Side Effects:** Ensure no unintended file modifications

### 6. Test Management Tools

#### Automated Test Approval
```bash
npm run test:fixture:approve    # Approve new expected outputs
npm run test:fixture:review     # Review pending changes
npm run test:fixture:reset      # Reset failed test states
```

#### Test Organization
- Group tests by refactoring command type
- Separate simple cases from edge cases
- Organize complex scenarios by feature area

## C# Implementation Adaptations

### Language-Specific Considerations

#### File Extensions and Naming
```csharp
// C# equivalent naming pattern
extract-method.input.cs         // Input C# file  
extract-method.expected.cs      // Expected result
extract-method.expected.out     // Console output
```

#### Project Configuration
```json
{
  "id": "extract-method-test",
  "description": "Extract method from complex calculation",
  "command": "extract-method 'Calculator.cs:15:20-15:45' --name 'CalculateDiscount'",
  "projectFile": "TestProject.csproj"
}
```

#### MSBuild Integration
- Include `.csproj` files in multi-file tests
- Validate NuGet package references
- Test against multiple .NET versions
- Handle project-to-project references

### C# Tool Architecture

#### Command Executor Adaptation
```csharp
public class CSharpCommandExecutor : ICommandExecutor
{
    public async Task<ExecutionResult> ExecuteAsync(
        string command, 
        string workingDirectory,
        CancellationToken cancellationToken = default)
    {
        // Handle C# compilation context
        // Manage MSBuild workspace
        // Execute Roslyn-based refactoring
    }
}
```

#### Roslyn Integration Points
- **Syntax Tree Management:** Handle C# syntax parsing
- **Semantic Model:** Validate symbol resolution
- **Compilation Context:** Ensure type checking integrity
- **Project System:** Maintain MSBuild compatibility

### Testing Strategies for C# Refactoring

#### Essential Test Categories

1. **Language Feature Tests:**
   - Generics and type parameters
   - LINQ expressions
   - Async/await patterns
   - Property and indexer handling
   - Event and delegate management

2. **Framework Integration:**
   - ASP.NET Core controllers
   - Entity Framework models
   - Dependency injection patterns
   - Attribute-based configuration

3. **Cross-Project Scenarios:**
   - Assembly boundary refactoring
   - Internal/public visibility changes
   - NuGet package refactoring
   - Multi-target framework support

#### Multi-File Test Structure for C#
```
tests/fixtures/commands/move-class/
├── web-api-move/
│   ├── fixture.config.json
│   ├── input/
│   │   ├── WebApi.sln
│   │   ├── Controllers/
│   │   │   └── UsersController.cs
│   │   ├── Models/
│   │   │   └── User.cs
│   │   └── Services/
│   │       └── UserService.cs
│   └── move-user-model.expected/
│       ├── Controllers/
│       │   └── UsersController.cs  # Updated imports
│       ├── Entities/
│       │   └── User.cs            # Moved file
│       └── Services/
│           └── UserService.cs     # Updated imports
```

## Best Practices

### Test Design Principles

1. **Comprehensive Coverage:**
   - Test happy paths and edge cases
   - Include error conditions and validation failures
   - Cover language-specific features thoroughly

2. **Maintainable Structure:**
   - Use descriptive test names
   - Group related tests logically
   - Document complex test scenarios

3. **Robust Validation:**
   - Verify all expected side effects
   - Test semantic preservation (code still compiles)
   - Validate refactoring safety

### Performance Considerations

1. **Parallel Execution:**
   - Run independent tests concurrently
   - Isolate test environments properly
   - Manage resource contention

2. **Efficient Cleanup:**
   - Remove temporary files promptly
   - Use incremental validation where possible
   - Implement smart caching for repeated operations

### Error Handling and Debugging

1. **Rich Error Messages:**
   - Show exact differences in outputs
   - Provide file location context
   - Include command execution details

2. **Debug Support:**
   - Preserve failed test artifacts
   - Enable verbose logging modes
   - Provide test reproduction instructions

## Migration Path

### Phase 1: Basic Infrastructure
1. Set up test discovery and loading
2. Implement single-file test validation
3. Create basic command execution framework

### Phase 2: Multi-File Support  
1. Add project-based test scenarios
2. Implement directory comparison logic
3. Handle build system integration

### Phase 3: Advanced Features
1. Add test approval workflows
2. Implement parallel test execution
3. Create comprehensive error reporting

### Phase 4: Tool Integration
1. Integrate with CI/CD pipelines
2. Add performance benchmarking
3. Create test generation utilities

## Conclusion

This fixture testing strategy provides a battle-tested approach for validating refactoring tools across diverse scenarios. The architecture scales from simple single-file transformations to complex multi-project refactoring operations while maintaining test reliability and developer productivity.

Key benefits:
- **Comprehensive validation** of refactoring correctness
- **Maintainable test suite** that evolves with the tool
- **Developer-friendly** debugging and error reporting  
- **Scalable architecture** supporting tool growth

By following this strategy, C# refactoring tools can achieve the same level of testing robustness demonstrated in RefakTS, ensuring reliable refactoring operations across the full spectrum of .NET development scenarios.