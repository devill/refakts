# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RefakTS is a TypeScript refactoring tool built for AI coding agents to perform precise refactoring operations via command line instead of requiring complete code regeneration. The tool uses ts-morph for AST manipulation and TypeScript analysis.

## Development Environment

**CRITICAL: Template Sync** When making changes to git hooks, scripts, or development setup, always check and update the template files in `dev-env-setup/` to keep them synchronized with the actual environment. These templates should be offered to users to include in their actual setup.

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
npm run dev -- inline-variable "[src/example.ts 5:8-5:18]"

# Quality tools
npm run quality -- "src/**/*.ts" "tests/**/*.ts"  # Run quality checks on specific glob patterns
npm run quality:full         # Run all quality checks with no limit (show all violations)

# Snooze quality alerts (24 hours)
npm run snooze incomplete <command>  # Snooze incomplete refactoring alerts
npm run snooze clear                 # Clear expired snoozes

# Roadmap management (use these frequently!)
npm run roadmap:status               # Check current feature priorities
npm run roadmap:vote <feature-name>  # Vote for useful features
npm run roadmap:add --feature <name> --description <desc>  # Add new feature ideas
npm run roadmap:remove <feature-name>  # Remove completed or obsolete features

# Usage tracking (automatic via git hooks)
npm run usage:report                 # View command usage statistics
npm run usage:consolidate            # Manually consolidate usage logs

# Fixture testing workflow
npm run test:fixture                                    # Run all fixture tests
npm run test:fixture:approve <fixture_path>             # Approve received files as expected for specific test (single-file fixtures only)
npm run test:fixture:approve:all                       # Auto-approve all received files as expected (single-file fixtures only)
npm run test:fixture:review <fixture_path>              # Review received files for a specific test (single-file fixtures only)
```


<!-- AUTO-GENERATED HELP START -->
## Available RefakTS Commands

```
- extract-variable [options] <target>  Extract expression into a variable
- inline-variable <target>             Replace variable usage with its value
- rename [options] <target>            Rename a variable and all its references
- select [options] <target>            Find code elements and return their locations with content preview
- variable-locator <target>            Find variable declarations and all their usages
- find-usages <target>                 Find all usages of a symbol across files (warning: incomplete)
- move-method [options] <target>       Move a method from one class to another (warning: incomplete)
```
<!-- AUTO-GENERATED HELP END -->


## Use your tools

**CRITICAL: Use your tools** when possible. If you find yourself making the same edit in multiple files consider using `sed`, `awk`

**CRITICAL: Dog fooding** `refrakts` is meant for AI agents like you (Claude). Use the already completed functionalities when you refactor. If you find a bug while using it **add it to the todo list immediately**.

## Refactoring Principles

**CORE APPROACH: "Minimal, surgical, trust the existing systems"** - This is the fundamental approach for all code changes. Avoid over-engineering, unnecessary abstractions, and complex error handling that masks real issues. Let errors bubble up naturally and change only what's broken.

**Prefer Meaningful Refactoring:**
- **Use destructuring** - Modern JavaScript/TypeScript features like spread operator (`...`) and destructuring can eliminate redundancy elegantly
- **Consider data structures** - Sometimes the real solution is introducing a proper class or data structure rather than more functions
- **Address root causes** - Look for code smells like repeated calls, excessive parameters, or unclear responsibilities
- **Prefer classes over interfaces** A frequent cause of feature envy is an over reliance on interfaces when a class would be a better choice

## Feature Roadmap 

**This tool is for you - make it what you wished it already was.** RefakTS development is driven by AI agents who actually use the tool.

### Core Principles & Commands

**Deterministic over Stochastic** • **Precise over General** • **Chainable over Monolithic** • **Fast over Comprehensive**

```bash
npm run roadmap:status               # Check current priorities
npm run roadmap:vote <feature-name>  # Vote for useful features  
npm run roadmap:add --feature "name" --description "desc" --why "reason"
```

### Contribution Guidelines

**Always check roadmap first:** `npm run roadmap:status` → Work on highest-voted features that have an issue assigned in GitHub → Vote for features that would have helped your session

**Feature Eligibility:** Only **deterministic and mechanical** features (search, transform, analyze). NOT reasoning tasks (naming, code quality, strategy) - you do those better.

**Examples:** ✅ "Find all variables named X" ✅ "Move file and update imports" ✅ "Extract method from selection" ✅ "Calculate coverage metrics"  
❌ "Suggest better names" ❌ "Detect code smells" ❌ "Recommend refactoring strategy"

**Usage Tracking:** Every refakts command usage is automatically logged. Git hooks show usage statistics after commits.

## Architecture

RefakTS follows a **command-based architecture** with clear separation of concerns. Commands implement `RefactoringCommand` interface and are registered through `CommandRegistry`. Each command encapsulates a specific refactoring operation.

The architecture is built on **ts-morph** for AST manipulation and TypeScript analysis. `ASTService` provides unified interface for loading TypeScript files. A **strategy pattern** powers flexible selection, where different `SelectionStrategy` implementations handle various code selection methods.

**Key insight**: RefakTS separates **what to find** (selection strategies) from **what to do** (command implementations).

### Unified Test Framework

**NEW ARCHITECTURE**: RefakTS now uses a unified testing framework that supports both single-file and multi-file fixtures with automatic test discovery.

**Test Types**:
- **Single-file tests** (`tests/fixtures/[category]/[command]/[test-name].input.ts`): For simple refactoring tests
- **Multi-file tests** (`tests/fixtures/commands/[command]/[test-name]/input/`): For complex scenarios requiring multiple files
- **Integration tests**: All fixtures are automatically discovered and run through `tests/integration/fixture.test.ts`

**File Structure**:
```
tests/fixtures/
├── refactoring/           # Single-file refactoring tests
│   └── extract-variable/
│       ├── basic-extraction.input.ts
│       └── basic-extraction.expected.ts
├── commands/              # Multi-file command tests
│   └── find-usages/
│       └── cross-file-import/
│           ├── fixture.config.json
│           ├── input/
│           │   ├── main.ts
│           │   └── utils/helpers.ts
│           └── basic-cross-file-usage.expected.out
```

**Expected Files**:
- `.expected.ts` - File transformation results
- `.expected.out` - Console output validation
- `.expected.err` - Error message validation
- `.expected/` - Directory with expected multi-file results

**Test Configuration**:
- `fixture.config.json` - Multi-file test configuration with test cases
- `@skip` annotation - Skip individual tests
- `@expect-error` annotation - Expect command to fail

**Files matching `*.received.*` are gitignored and appear only during test failures.**

### Unit Test Guidelines

**For unit tests, always use the `approvals` framework when testing against expected text output.** This ensures consistency and follows established patterns.

**Approvals Framework Usage**:
```typescript
import { verify } from 'approvals';

// In your test
verify(__dirname, 'test-name', result, { reporters: ['donothing'] });
```

**Key Benefits**:
- **Automatic file management**: Approved files are stored next to the test file
- **Clear diff visualization**: When tests fail, you can see exactly what changed
- **Simple approval workflow**: Copy received files to approved files when output is correct
- **CI-friendly**: Use `{ reporters: ['donothing'] }` to avoid GUI diff tools in tests

**File Organization**:
- **Fixture tests**: Use the `tests/fixtures/` directory for end-to-end command testing
- **Unit tests**: Use approvals for text output validation, stored next to the test file
- **Behavioral tests**: Use standard Jest expectations for behavior validation

**When to Use Each Approach**:
- **Approvals**: When testing text output, formatted strings, generated code, or any string-based results
- **Jest expectations**: When testing behavior, return values, object properties, or method calls
- **Fixtures**: When testing complete command workflows end-to-end

## Development Workflow

Use the STARTER_CHARACTER at the start of the line to indicate your workflow state

1. 🗺 Check roadmap (`npm run roadmap:status`)
2. 😺 Assign the issue on GitHub to the current user. (Don't work on issues already assigned)
3. 📐 Design the interface and ask the user for feedback
4. 🧪 Add test cases. (Use fixtures in `tests/fixtures` when relevant)
5. 👀 Run tests to see current behavior vs expected. Stop and ask the user for feedback before implementing.
6. 💭 Imagine what architecture would make implementation easy.
7. ♻️ If necessary put tests on skip, and refactor to the ideal architecture 
8. 👷 Unskip tests one by one, and implement the functionality 
9. ✅ Run the tests, check and validate
10. 🎉 Try the new command. (Create a temporary file and test on that)
11. 📄 Once tests are passing update the `refakts --help`.
12. ♻️ After committing refactor to resolve quality issues.
13. 🗳️ Vote for roadmap features that would have helped this session, add features you wished existed


## GitHub Issue Format

When creating GitHub issues for RefakTS features, use this format:

```markdown
Brief description of the feature/task.

### Dependencies (if applicable)
- Depends on #X (feature-name) - Explanation of why this dependency exists

### Acceptance Criteria
- [ ] Specific, testable requirement
- [ ] Another requirement
- [ ] Final requirement (e.g., update documentation)
```

**Labels to use:**
- `RefakTS Command` - New commands for the product
- `House Keeping` - Development flow and codebase organization
- `Quality Checks` - Post-commit quality check system additions
- `Good first issue` - Easy tasks for new contributors

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

### Quality Standards
- **NEVER** declare code "excellent" or "in good condition" while quality warnings exist
- **ALWAYS** continue working until `npm run quality` shows zero violations
- **REMEMBER** that builds will reject code with quality warnings
- **COMPLETE** all quality fixes before considering the task done