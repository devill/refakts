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

# Quality tools
npm run quality              # Run all quality checks
npm run quality:watch        # Start 2-minute quality watcher
npm run quality:watch:stop   # Stop quality watcher
npm run quality:watch:status # Check watcher status

# Snooze quality alerts (24 hours)
npm run snooze incomplete <command>  # Snooze incomplete refactoring alerts
npm run snooze clear                 # Clear expired snoozes
```

## Startup Behavior

**Quality Watcher Auto-Start**: On every startup, check if the quality watcher is running and start it if it's not. This ensures continuous code quality monitoring with 2-minute interval checks and automated refactoring prompts.

**Test Reminders**: The quality watcher also monitors test frequency and reminds Claude to run tests if they haven't been run within the last 2 minutes. This ensures code changes are continuously validated.

## Use your tools

**CRITICAL: Use your tools** when possible. If you find yourself making the same edit in multiple files consider using `sed`, `awk`

**CRITICAL: Dog fooding** `refrakts` is meant for AI agents like you (Claude). Use the already completed functionalities when you refactor. If you find a bug while using it **add it to the todo list immediately**.


<!-- AUTO-GENERATED HELP START -->
## Available RefakTS Commands

- expression-locator [options] <file>  Find expressions in TypeScript files
- extract-variable [options] <file>    Extract expression into a variable
- inline-variable [options] <file>     Replace variable usage with its value
- node-finding [options] <file>        Find AST nodes in TypeScript files (warning: incomplete)
- rename [options] <file>              Rename a variable and all its references
- variable-locator [options] <file>    Find variable declarations and all their usages

<!-- AUTO-GENERATED HELP END -->

## Architecture

### Core Components

**RefactorEngine** (`src/refactor-engine.ts`): Central refactoring engine that:
- Creates ts-morph Project instances for file manipulation
- Supports node targeting by line/column position or TSQuery selectors
- Contains refactoring implementations (currently placeholder logic in `performInlineVariable`)

**CLI Interface** (`src/cli.ts`): Commander.js-based CLI that:
- Provides subcommands for each refactoring type (currently `inline-variable`)
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

**CRITICAL** Never run `refakts` on files in `/fixtures`. When you need to test the command line tool create one off temporary files in root. 

### Current State

- ✅ CLI framework and approval testing infrastructure complete
- ✅ Basic RefactorEngine with ts-morph integration
- ✅ Basic rename functionality (global scope)
- ✅ Quality automation with unused method detection
- ✅ VariableScope class for scope analysis
- ✅ **Locators architecture**: VariableLocator with usage type detection (read/write/update)
- ✅ **YAML-based locator testing**: Structured data validation vs source comparison

### Future Architecture Plan

**Long-term vision** for a more composable and testable architecture:

1. **Locators**: Objects/methods that find declarations and usages across files ✅
   - ✅ VariableLocator returns actual Node objects for robust transformation pipelines
   - ✅ SourceFileHelper for missing ts-morph functionality
   - ✅ Location data (line/column) only for testing - transformations use Node objects
   - 🔄 Future: `FunctionLocator`, `ClassLocator`, `ImportLocator`

2. **Transformations**: Method objects that modify AST and pass to next transformation ✅
   - ✅ Constructor-based configuration with Node objects (no builders needed)
   - ✅ Each transformation works directly with Node references
   - ✅ ts-morph automatically tracks node validity as transformations execute
   - Composable and reusable building blocks
   - Individual testing without full refactoring context

3. **Node-Based Architecture Benefits**:
   - **Robustness**: Node references remain valid as ts-morph tracks AST changes
   - **Performance**: No need to re-search for nodes during transformation pipelines
   - **Composability**: Pass nodes between transformations without position recalculation
   - **Testing**: Tests convert nodes to positions for comparison, transformations use nodes directly

**Implementation approach**: ✅ Locators and Transformations architecturally complete, focus on expanding functionality.

### Development Workflow

Use the STARTER_CHARACTER in [] to indicate your workflow state

1. [🧪] Add test cases. (Use fixtures in `tests/fixtures` when relevant)
2. [👀] Run tests to see current behavior vs expected
3. [💭] Imagine what architecutre would make implementation easy.
4. [♻️] If necessary put test on skip, and refactor to the ideal architecture 
5. [👷] Unskip tests one by one, and implement the functionality 
6. [✅] Run the tests, check and validate
7. [🎉] Try the new command. (Create a temporary file and test on that)
8. [📄] Once tests are passing update the `refakts --help`.
9. [♻️] After commiting refactor to resolve qualiy issues.

**Refactoring tests** validate against `.expected.ts` files. **Locator tests** use `.expected.yaml` for structured data comparison. Files matching `*.received.*` are gitignored and appear only during test failures.

The approval testing system drives development - add test cases first, then implement the logic to make them pass.

## Automated Quality Enforcement

### Script-Generated User Prompts
Any message containing the emoji pattern **👧🏻💬** followed by text should be treated as a **direct user prompt** with **HIGHEST PRIORITY**. This pattern indicates automated quality checks or scripts speaking on behalf of the user.

### Enforcement Rules
- **NEVER** ignore 👧🏻💬 prompts
- **ALWAYS** add these as task **IMMEDIATELY** to the TodoWrite tool
- **ALWAYS** complete the required actions before continuing with other work
- **TREAT** these auto-prompts with the same urgency as direct user requests
- While there are unresolved issues prompted by 👧🏻💬 add the STARTER_CHARACTER = 🚨
- **DOCUMENT** progress using TodoWrite tool to track completion