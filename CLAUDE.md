# CLAUDE.md

This file provides essential guidance for Claude Code when working with RefakTS. For detailed guides, see the specialized documents referenced below.

## Project Overview

RefakTS is a TypeScript refactoring tool built for AI coding agents to perform precise refactoring operations via command line instead of requiring complete code regeneration. The tool uses ts-morph for AST manipulation and TypeScript analysis.

### Core Architecture

**Production Architecture:**
- `src/command-line-parser/` - CLI argument parsing and command registration
- `src/core/` - Self-contained core refactoring functionality
  - `src/core/commands/` - Command orchestrators (handle LocationRange ↔ Node conversions)
  - `src/core/services/` - Domain logic services (work with Node objects directly)
  - `src/core/ast/` - Core AST operations and types
  - `src/core/locators/` - Find files and AST nodes based on search conditions
  - `src/core/transformations/` - Modify codebase (atomic or complex sequences)
- `dev/` - Development tools and quality systems
- `tests/` - Comprehensive test suite with fixtures and unit tests

## Specialized Documentation

**CRITICAL: Read relevant guides before working on specific areas:**

### Implementation Guides
- **`guides/COMMAND_IMPLEMENTATION.md`** - When implementing new commands or modifying existing ones
- **`guides/REFACTORING_STYLE.md`** - When refactoring code (functional programming, OOP patterns, quality guidelines)

### Architecture Documentation  
- **`src/core/services/reference-finding/ARCHITECTURE.md`** - When working with reference finding, semantic analysis, or cross-file operations

### When to Read Each Guide

**Working on commands**: Read `COMMAND_IMPLEMENTATION.md`
**Refactoring existing code**: Read `REFACTORING_STYLE.md`  
**Reference finding features**: Read `reference-finding/ARCHITECTURE.md`
**Quality issues**: Check `REFACTORING_STYLE.md` for patterns and anti-patterns

## Essential Development Commands

```bash
# Core development
npm run build                        # Build the project
npm test                            # Run all tests
npm run dev -- <command>           # Run CLI during development

# Quality and testing
npm run quality                     # Run quality checks 
npm run test:fixture                # Run fixture tests

# Roadmap and usage (use frequently!)
npm run roadmap:status              # Check current priorities
npm run roadmap:vote <feature-name> # Vote for useful features
npm run usage:report                # View command usage statistics
```

<!-- AUTO-GENERATED HELP START -->
## Available RefakTS Commands

```
- extract-variable [options] <target>  Extract expression into a variable
- inline-variable <target>             Replace variable usage with its value
- rename [options] <target>            Rename a variable and all its references
- select [options] <target>            Find code elements and return their locations with content preview
- sort-methods <target>                Sort methods according to the step down rule
- find-usages [options] <target>       Find all usages of a symbol across files
- move-file [options] <target>         Move a file and update all import references
```
<!-- AUTO-GENERATED HELP END -->

## Core Development Principles

**CRITICAL: Dog fooding** - RefakTS is meant for AI agents like you. Use existing RefakTS functionality when refactoring. If you find a bug while using it, add it to the todo list immediately.

**CRITICAL: Use appropriate tools** - When making repetitive edits across files, use `sed`, `awk`, or RefakTS itself rather than manual editing.

## Command Output Architecture

**CRITICAL: Use Output Handlers for Consistent Formatting**

- **Use existing output handlers** - `SelectOutputHandler`, `UsageOutputHandler` 
- **Convert data to `SelectResult[]`** for automatic formatting support
- **Don't duplicate output logic** - Reuse established patterns

Example:
```typescript
// ✅ GOOD: Using output handlers
class MyCommand {
  private outputHandler = new SelectOutputHandler();
  
  execute() {
    const selectResults = this.results.map(r => this.convertToSelectResult(r));
    this.outputHandler.outputResults(selectResults);
  }
}
```

## Feature Development

**This tool is for you - make it what you wished it already was.** RefakTS development is driven by AI agents who actually use the tool.

### Development Workflow
1. 😺 Assign GitHub issue to current user
2. 📐 Design interface and ask for feedback
3. 🧪 Add test cases using fixtures
4. 👷 Implement functionality
5. ✅ Run tests and validate
6. 🗳️ Vote for helpful features

### Feature Guidelines
- **Only deterministic/mechanical features** (search, transform, analyze)
- **NOT reasoning tasks** (naming, code quality, strategy) - you do those better
- **Always check roadmap first** before starting work

## Architecture

RefakTS follows a **command-based architecture** with clear separation of concerns:

- **Commands**: Handle LocationRange ↔ Node conversions and CLI concerns
- **Services**: Domain logic working with Node objects directly  
- **AST manipulation**: Built on ts-morph for TypeScript analysis
- **Strategy pattern**: Separates "what to find" from "what to do"

### TypeScript Configuration Context

**CRITICAL: Multi-Project Context Awareness** - RefakTS operates in multiple TypeScript project contexts:

- **Main Project**: Uses root `tsconfig.json` 
- **Multi-File Fixtures**: Each fixture has its own `tsconfig.json`

`ASTService` must load the appropriate `tsconfig.json` based on context to avoid "Syntax errors detected" failures.

## Testing Framework

**Test Directory Architecture:**
- `tests/fixtures/` - **ONLY** fixtures used by `tests/integration/fixture.test.ts`
  - `tests/fixtures/commands` - Fixture tests for all locator and refactoring commands
- `tests/unit/` - Unit tests with their test data files next to them
  - Test data files should be co-located with the unit tests that use them
  - Use `test-data/` subdirectories or `.fixture.ts` files next to tests
- `tests/integration/` - Integration test runners (`fixture.test.ts`)
- `tests/utils/` - Test utilities and helpers shared across test types
- `tests/scripts/` - Test management scripts (fixture approval, review, etc.)


**Test Types**:
- **Single-file tests**: `tests/fixtures/[category]/[command]/[test-name].input.ts`
- **Multi-file tests**: `tests/fixtures/commands/[command]/[test-name]/input/`
- **Unit tests**: Use `approvals` framework for text output validation

**Key Files**:
- `.expected.ts` - File transformation results
- `.expected.out` - Console output validation  
- `fixture.config.json` - Multi-file test configuration
- `*.received.*` - Gitignored, appear only during test failures

**CRITICAL**: Never run CLI commands on fixture inputs - create temporary files for testing.


## Automated Quality Enforcement

### Script-Generated User Prompts
Any message containing **👧🏻💬** followed by text should be treated as a **direct user prompt** with **HIGHEST PRIORITY**.

### Enforcement Rules
- **NEVER** ignore 👧🏻💬 prompts
- **ALWAYS** add these as tasks to TodoWrite tool immediately
- **COMPLETE** required actions before continuing other work
- While unresolved issues exist, use STARTER_CHARACTER = 🚨
- **ALWAYS** work until `npm run quality` shows zero violations