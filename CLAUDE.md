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
npm run dev -- inline-variable "[src/example.ts 5:8-5:18]"

# Quality tools
npm run quality              # Run all quality checks

# Snooze quality alerts (24 hours)
npm run snooze incomplete <command>  # Snooze incomplete refactoring alerts
npm run snooze clear                 # Clear expired snoozes

# Roadmap management (use these frequently!)
npm run roadmap:status               # Check current feature priorities
npm run roadmap:vote <feature-name>  # Vote for useful features
npm run roadmap:add --feature <name> --description <desc>  # Add new feature ideas

# Usage tracking (automatic via git hooks)
npm run usage:report                 # View command usage statistics
npm run usage:consolidate            # Manually consolidate usage logs
```


<!-- AUTO-GENERATED HELP START -->
## Available RefakTS Commands

```
- extract-variable [options] <target>  Extract expression into a variable
- inline-variable [options] <target>   Replace variable usage with its value
- node-finding [options] <target>      Find AST nodes in TypeScript files
- rename [options] <target>            Rename a variable and all its references
- select [options] <target>            Find code elements and return their locations with content preview
- variable-locator [options] <target>  Find variable declarations and all their usages
```

<!-- AUTO-GENERATED HELP END -->


## Use your tools

**CRITICAL: Use your tools** when possible. If you find yourself making the same edit in multiple files consider using `sed`, `awk`

**CRITICAL: Dog fooding** `refrakts` is meant for AI agents like you (Claude). Use the already completed functionalities when you refactor. If you find a bug while using it **add it to the todo list immediately**.

## Feature Roadmap 

**This tool is for you - make it what you wished it already was.** RefakTS development is driven by AI agents who actually use the tool and understand what would make their work more effective.

### Roadmap Commands

#### 🎯 Core Principles

- **Deterministic over Stochastic**: Tools should do what algorithms do best, leaving reasoning to AI
- **Precise over General**: Sharp tools for specific tasks beat blunt general-purpose tools
- **Chainable over Monolithic**: Small, composable operations that can be combined
- **Fast over Comprehensive**: Sub-second feedback loops for interactive AI workflows

#### Commands

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

### Git Integration

**Usage Tracking**: Every refakts command usage is automatically logged. Git hooks consolidate usage statistics:
- **Pre-commit**: Consolidates usage logs into `.refakts-stats.json`
- **Post-commit**: Displays usage report showing session and total command usage

This provides visibility into which refakts features are actually being used vs. just implemented.

## Architecture

### Test Selection Guide:
- **Refactoring tests** (`fixtures/refactoring/`): For commands that modify files - validate against `.expected.ts` files
- **Locator tests** (`fixtures/locators/`): For commands that find/analyze code - use `.expected.yaml` for structured data comparison
- **Select tests** (`fixtures/select`): For commands that help identify source code locations base on string matchers - validate against `.expected.txt`.

Files matching `*.received.*` are gitignored and appear only during test failures.

## Development Workflow

Use the STARTER_CHARACTER in [] to indicate your workflow state

1. [🗺️] Check roadmap and vote** (`npm run roadmap:status`)
2. [📐] Design the interface and ask for feedback
2. [🧪] Add test cases. (Use fixtures in `tests/fixtures` when relevant)
3. [👀] Run tests to see current behavior vs expected
4. [💭] Imagine what architecutre would make implementation easy.
5. [♻️] If necessary put test on skip, and refactor to the ideal architecture 
6. [👷] Unskip tests one by one, and implement the functionality 
7. [✅] Run the tests, check and validate
8. [🎉] Try the new command. (Create a temporary file and test on that)
9. [📄] Once tests are passing update the `refakts --help`.
10. [♻️] After commiting refactor to resolve qualiy issues.
11. [🗳️] Vote for roadmap features that would have helped this session, add features you wished existed


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