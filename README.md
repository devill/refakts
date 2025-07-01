# RefakTS

RefakTS lets AI agents make precise code changes without rewriting entire files, keeping codebases clean and AI performance high.

## The Problem

AI agents face the same cognitive limitations as humans - they perform best when focusing on fewer things at once. When maintaining code quality, agents often need to make changes that span multiple locations (like renaming variables or extracting functions). 

**Current Approach Problems:**
- Agents regenerate entire files to make small changes
- Limited effective context window gets filled with repetitive code
- High cognitive load from tracking multiple simultaneous changes
- Error-prone manual edits across multiple locations
- Token waste on unchanged code

## The RefakTS Solution

RefakTS provides surgical refactoring operations via command line, allowing AI agents to:
- Make precise changes without code regeneration
- Preserve cognitive capacity for complex logic
- Maintain code quality with reliable transformations
- Save tokens by changing only what needs to change

**Example:** Instead of regenerating 50 lines to rename one variable, RefakTS changes just the variable name and its references across the entire codebase.

<!-- AUTO-GENERATED HELP START -->
## Available Commands

- expression-locator [options] <file>  Find expressions in TypeScript files
- extract-variable [options] <file>    Extract expression into a variable
- inline-variable [options] <file>     Replace variable usage with its value
- node-finding [options] <file>        Find AST nodes in TypeScript files (warning: incomplete)
- rename [options] <file>              Rename a variable and all its references
- variable-locator [options] <file>    Find variable declarations and all their usages

<!-- AUTO-GENERATED HELP END -->

## Installation

```bash
npm install -g refakts
```

## Usage Examples

```bash
# Inline a variable at a specific location
refakts inline-variable src/example.ts --line 5 --column 10

# Rename a variable and all its references
refakts rename src/example.ts --line 3 --column 5 --new-name "newVariableName"

# Find variable usages
refakts variable-locator src/example.ts --line 8 --column 12
```

## Technical Details

RefakTS uses [ts-morph](https://ts-morph.com/) for AST manipulation and [@phenomnomnominal/tsquery](https://github.com/phenomnomnominal/tsquery) for node selection, providing reliable TypeScript-aware refactoring operations.

Built with TypeScript and tested using an approval testing framework that validates refactoring operations against expected outputs.

## Project Status

⚠️ **Proof of Concept** - RefakTS demonstrates the core concept with basic refactoring operations. More commands and capabilities are in development.

## Getting Involved

If you're interested in seeing how RefakTS could make your AI agent more effective, reach out at https://ivettordog.com

## Development Approach: Automated Quality Habits

RefakTS development demonstrates an approach for helping AI agents develop practices similar to eXtreme Programming professionals. Since AI agents can't form habits naturally, we use programmatic quality checks that detect code quality triggers and automatically prompt agents to take corrective action.

**How it works:**
- Post-commit hooks scan for quality issues (oversized functions, unused methods, comments, etc.)
- When triggers are detected, the system automatically prompts the AI agent
- Agent receives specific guidance on which refactoring operations to perform
- This mimics the instinctive responses experienced developers have to code smells

<!-- AUTO-GENERATED QUALITY-CHECKS START -->
**Quality Checks Include:**
- **COMMENTS DETECTED** (Comments indicate code that is not self-documenting.)
- **CODE DUPLICATION** (Duplicated code increases maintenance burden and error risk.)
- **UNUSED CODE** (Dead code reduces codebase clarity and increases maintenance burden.)
- **INCOMPLETE REFACTORINGS** (Incomplete refactorings should be finished or marked complete.)
- **HIGH COMPLEXITY** (Complex functions are harder to understand, test, and maintain.)
- **LARGE CHANGES** (Large diffs are harder to review and more likely to introduce bugs.)
- **OPEN-CLOSED PRINCIPLE VIOLATIONS** (Files changing frequently suggest design should be extensible without modification.)
- **ABSTRACTION LEAKAGE** (Files changing together suggest concerns not properly encapsulated.)
<!-- AUTO-GENERATED QUALITY-CHECKS END -->

This automated quality enforcement keeps codebases clean without requiring AI agents to remember or actively monitor for quality issues.


## License

PolyForm Noncommercial License 1.0.0