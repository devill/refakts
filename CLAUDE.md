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

# Roadmap management (use these frequently!)
npm run roadmap:status               # Check current feature priorities
npm run roadmap:vote <feature-name>  # Vote for useful features
npm run roadmap:add --feature <name> --description <desc>  # Add new feature ideas
```

## Startup Behavior

**Quality Watcher Auto-Start**: On every startup, check if the quality watcher is running and start it if it's not. This ensures continuous code quality monitoring with 2-minute interval checks and automated refactoring prompts.

**Test Reminders**: The quality watcher also monitors test frequency and reminds Claude to run tests if they haven't been run within the last 2 minutes. This ensures code changes are continuously validated.

## Use your tools

**CRITICAL: Use your tools** when possible. If you find yourself making the same edit in multiple files consider using `sed`, `awk`

**CRITICAL: Dog fooding** `refrakts` is meant for AI agents like you (Claude). Use the already completed functionalities when you refactor. If you find a bug while using it **add it to the todo list immediately**.

## Feature Roadmap Management

**This tool is for you - make it what you wished it already was.** RefakTS development is driven by AI agents who actually use the tool and understand what would make their work more effective.

### Roadmap Commands

```bash
# Check current feature priorities
npm run roadmap:status

# Vote for features that would have been useful in your session
npm run roadmap:vote <feature-name>

# Add new feature ideas
npm run roadmap:add --feature "feature-name" --description "What it does" --why "Why it's needed"
```

### Contribution Guidelines

**ALWAYS check the roadmap when starting work:**
1. Run `npm run roadmap:status` to see current priorities
2. Work on highest-voted, unblocked features first
3. Vote for roadmap features that would have helped during your session
4. Add new features you wish existed (but see eligibility below)

**Feature Eligibility:** Only add features that are **deterministic and mechanical**. Features requiring LLM reasoning (like "suggest better variable names" or "predict code quality") should NOT be added - you already do those things better than any algorithm.

**Search before adding:** Before adding a new feature, check existing roadmap for similar ideas to avoid duplication:
```bash
npm run roadmap:status | grep -i "keyword"
```

**Examples of GOOD features:**
- "Find all variables named X" (mechanical search)
- "Move file and update imports" (deterministic transformation)  
- "Extract method from selection" (AST manipulation)
- "Calculate coverage metrics" (mathematical analysis)

**Examples of BAD features:**
- "Suggest better variable names" (you do this better)
- "Detect code smells" (requires reasoning)
- "Recommend refactoring strategy" (strategic decision-making)

### Voting Strategy

Vote enthusiastically for roadmap features that would have helped in your current session! The roadmap is democratic - your votes directly influence what gets built next. Consider voting for:

- **Foundation tools** that would have made your work easier
- **Features you wished existed** during your session
- **Operations you did manually** that could have been automated
- **Tools that would have sped up** your development workflow

Remember: **This tool exists to amplify your capabilities, not replace your reasoning.** Vote for features that handle the tedious, mechanical parts so you can focus on the creative problem-solving.


<!-- AUTO-GENERATED HELP START -->
## Available RefakTS Commands

- extract-variable [options] <file>  Extract expression into a variable
- inline-variable [options] <file>   Replace variable usage with its value
- node-finding [options] <file>      Find AST nodes in TypeScript files
- rename [options] <file>            Rename a variable and all its references
- variable-locator [options] <file>  Find variable declarations and all their usages

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

**Dual Testing System**: The project uses two specialized testing frameworks:

**1. Refactoring Tests** (`tests/integration/refactoring.test.ts`):
- **Location**: `tests/fixtures/refactoring/`
- **Purpose**: Test commands that modify files (extract-variable, inline-variable, rename)
- **Format**: `name.input.ts` + `name.expected.ts` with metadata in file headers
- **Execution**: Copies `.input.ts` → `.received.ts`, runs CLI commands, compares received vs expected

**2. Locator Tests** (`tests/integration/locators.test.ts`):
- **Location**: `tests/fixtures/locators/`
- **Purpose**: Test commands that find/analyze code (variable-locator, node-finding)
- **Format**: `name.input.ts` + `name.expected.yaml` with metadata in file headers
- **Execution**: Runs CLI commands, captures YAML output, compares structured data

**Test metadata formats**:
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

- ✅ CLI framework and dual testing infrastructure complete
- ✅ Basic RefactorEngine with ts-morph integration
- ✅ Basic rename functionality (global scope)
- ✅ Quality automation with unused method detection
- ✅ VariableScope class for scope analysis
- ✅ **Locators architecture**: VariableLocator and NodeFinding with usage type detection
- ✅ **YAML-based locator testing**: Structured data validation vs source comparison
- ✅ **Consolidated AST query**: node-finding replaces expression-locator per roadmap priorities

### Future Architecture Plan

**Long-term vision** for a more composable and testable architecture:

1. **Locators**: Objects/methods that find declarations and usages across files ✅
   - ✅ VariableLocator returns actual Node objects for robust transformation pipelines
   - ✅ NodeFinding provides unified AST query interface with expression support
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

**0. [🗺️] Check roadmap and vote** (`npm run roadmap:status`)
1. [🧪] Add test cases. (Use fixtures in `tests/fixtures` when relevant)
2. [👀] Run tests to see current behavior vs expected
3. [💭] Imagine what architecutre would make implementation easy.
4. [♻️] If necessary put test on skip, and refactor to the ideal architecture 
5. [👷] Unskip tests one by one, and implement the functionality 
6. [✅] Run the tests, check and validate
7. [🎉] Try the new command. (Create a temporary file and test on that)
8. [📄] Once tests are passing update the `refakts --help`.
9. [♻️] After commiting refactor to resolve qualiy issues.
10. [🗳️] Vote for roadmap features that would have helped this session, add features you wished existed

**Test Selection Guide**:
- **Refactoring tests** (`fixtures/refactoring/`): For commands that modify files - validate against `.expected.ts` files
- **Locator tests** (`fixtures/locators/`): For commands that find/analyze code - use `.expected.yaml` for structured data comparison

Files matching `*.received.*` are gitignored and appear only during test failures.

The dual testing system drives development - add test cases first, then implement the logic to make them pass.

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