# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RefakTS is a TypeScript refactoring tool built for AI coding agents to perform precise refactoring operations via command line instead of requiring complete code regeneration. The tool uses ts-morph for AST manipulation and @phenomnomnominal/tsquery for node selection.

## Development Commands

```bash
# Build the project
npm run build

# Run all tests
npm test

# Watch mode for tests during development
npm test:watch

# Run CLI during development (without building)
npm run dev -- <command>

# Example: Test inline-variable refactoring
npm run dev -- inline-variable src/example.ts --line 5 --column 10
```

## Architecture

### Core Components

**RefactorEngine** (`src/refactor-engine.ts`): Central refactoring engine that:
- Creates ts-morph Project instances for file manipulation
- Supports node targeting by line/column position or TSQuery selectors
- Contains refactoring implementations (currently placeholder logic in `performInlineVariable`)

**CLI Interface** (`src/cli.ts`): Commander.js-based CLI that:
- Provides subcommands for each refactoring type (currently `inline-variable`)
- Supports dual targeting: `--line X --column Y` or `--query "TSQuery selector"`
- Acts as thin wrapper around RefactorEngine methods

### Testing Architecture

**Approval Testing System**: The project uses a sophisticated approval testing framework located in `tests/integration/refactoring.test.ts` that:

- **Auto-discovers test cases** from `tests/fixtures/` directory structure
- **Supports two test formats**:
  - Single-file tests: `name.input.ts` + `name.expected.ts` with metadata in file headers
  - Multi-file tests: Subdirectories with `meta.yaml` containing test commands
- **Test execution flow**: Copies `.input.ts` → `.received.ts`, runs CLI commands, compares received vs expected
- **Test metadata formats**:
  ```ts
  // Single file header format
  /**
   * @description Test description
   * @command refakts inline-variable file.ts --line 8 --column 10
   */
  ```
  ```yaml
  # Multi-file meta.yaml format
  description: Test description
  commands:
    - refakts inline-variable file.ts --line 8 --column 10
  ```

### Current State

- ✅ CLI framework and approval testing infrastructure complete
- ✅ Basic RefactorEngine with ts-morph integration
- ❌ Actual refactoring logic not yet implemented (placeholder in `performInlineVariable`)

### File Targeting

The RefactorEngine supports two targeting methods:
1. **Position-based**: `--line X --column Y` (1-based indexing)
2. **Query-based**: `--query "TSQuery selector"` for semantic targeting

Both methods resolve to ts-morph Node objects for manipulation.

### Development Workflow

1. Add test cases to `tests/fixtures/<refactoring-type>/`
2. Run tests to see current behavior vs expected
3. Implement refactoring logic in RefactorEngine
4. Tests automatically validate against `.expected.ts` files
5. Files matching `*.received.ts` are gitignored and appear only during test failures

The approval testing system drives development - add test cases first, then implement the logic to make them pass.