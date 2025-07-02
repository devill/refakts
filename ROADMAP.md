# RefakTS Roadmap

RefakTS aims to be the ultimate **deterministic refactoring toolkit** for AI coding agents. Our philosophy: **AI agents excel at reasoning and decision-making, but need powerful, precise tools for mechanical code transformations**.

## 🎯 Core Principles

- **Deterministic over Stochastic**: Tools should do what algorithms do best, leaving reasoning to AI
- **Precise over General**: Sharp tools for specific tasks beat blunt general-purpose tools  
- **Chainable over Monolithic**: Small, composable operations that can be combined
- **Fast over Comprehensive**: Sub-second feedback loops for interactive AI workflows

## 📊 Feature Voting System

After each development session, contributors can vote on features:

```bash
# Vote for a feature (adds +1 to priority score)
npm run roadmap:vote --feature "regex-ast-locator"

# Add new feature request
npm run roadmap:add --feature "selection-tool" --description "Select AST ranges for operations"

# View current priorities
npm run roadmap:status
```

---

## 🚀 Roadmap by Priority

### **Tier 1: Foundation Tools** *(Score: Unscored)*

#### 1. **Regex-based AST Locator** 
**Status**: 🆕 Proposed  
**Description**: Find AST nodes by text content, not complex queries
```bash
refakts locate file.ts --text "complexCalculation" --type variable
refakts locate file.ts --pattern "handle.*Error" --type function
```
**Why Critical**: Makes targeting for refactoring operations 10x simpler
**Dependencies**: None

#### 2. **Selection Tool**
**Status**: 🆕 Proposed  
**Description**: Select AST ranges between two points for range-based operations
```bash
refakts select file.ts --start-text "function process" --end-text "return result"
refakts extract-method file.ts --selection @last --name "processCore"
```
**Why Critical**: Enables extract-method, comment-region, and other range operations
**Dependencies**: #1 (Regex-based locator)

#### 3. **Function Body Extractor**
**Status**: 🆕 Proposed  
**Description**: Get just the body of a function without reading entire files
```bash
refakts function-body file.ts --name "calculateTotal"
# Returns: "const sum = a + b; return sum * factor;"
```
**Why Critical**: Massive performance improvement for AI agents analyzing code
**Dependencies**: #1

#### 4. **Complete General AST Query Engine**
**Status**: 🔄 In Progress (node-finding-command exists but incomplete)  
**Description**: Replace expression-locator with completed, general-purpose node finder
```bash
refakts find file.ts --query "FunctionDeclaration[name.text='process']"
refakts find file.ts --pattern "*.test.ts" --query "CallExpression[expression.text='describe']"
```
**Why Critical**: Foundation for complex refactoring operations
**Dependencies**: None

### **Tier 2: Core Refactoring Automation** *(Score: Unscored)*

#### 5. **Smart Method Extraction**
**Status**: 🆕 Proposed  
**Description**: Extract methods with automatic parameter/return detection
```bash
refakts extract-method file.ts --selection @last --name "processData"
# Automatically handles: parameters, return values, scope analysis
```
**Why Critical**: Most common refactoring operation needs automation
**Dependencies**: #2 (Selection), #4 (Query Engine)

#### 6. **Automated Dead Code Elimination**
**Status**: 🆕 Proposed  
**Description**: Safe removal of unused code with impact analysis
```bash
refakts remove-unused file.ts --dry-run  # Show what would be removed
refakts remove-unused file.ts --confirm   # Actually remove
```
**Why Critical**: Quality maintenance automation - removes manual analysis
**Dependencies**: #4 (Query Engine)

#### 7. **Dependency Chain Refactoring**
**Status**: 🆕 Proposed  
**Description**: Reduce coupling by extracting interfaces and injecting dependencies
```bash
refakts extract-interface src/services/ --coupling-analysis
refakts inject-dependencies src/commands/ --interface @last
```
**Why Critical**: Addresses architectural debt automatically
**Dependencies**: #4 (Query Engine), #5 (Method Extraction)

### **Tier 3: Advanced Mechanical Operations** *(Score: Unscored)*

#### 8. **File Structure Refactoring**
**Status**: 🆕 Proposed  
**Description**: Move files and automatically update all imports/references
```bash
refakts move-file src/old-location.ts src/new-location.ts --update-imports
refakts organize-directory src/services/ --by-coupling  # Group related files
```
**Why Critical**: Solves architectural organization without manual import hunting
**Dependencies**: #4 (Query Engine)

#### 9. **Test-Driven Refactoring Support**
**Status**: 🆕 Proposed  
**Description**: Ensure test coverage during refactoring operations
```bash
refakts extract-method file.ts --preserve-coverage --generate-tests
refakts remove-unused file.ts --test-impact-analysis
```
**Why Critical**: Maintains reliability during automated refactoring
**Dependencies**: #5 (Method Extraction), #6 (Dead Code Removal)

#### 10. **Batch Refactoring Operations**
**Status**: 🆕 Proposed  
**Description**: Chain multiple refactoring operations with rollback
```bash
refakts batch-start "cleanup-services"
refakts extract-method file1.ts --selection @sel1 --name "process"
refakts remove-unused src/services/
refakts move-file src/old.ts src/new.ts
refakts batch-commit  # Or batch-rollback if something failed
```
**Why Critical**: Enables complex, multi-step refactoring workflows
**Dependencies**: All core operations (#5-#9)

### **Tier 4: Analysis & Workflow** *(Score: Unscored)*

#### 11. **Code Relationship Analysis**
**Status**: 🆕 Proposed  
**Description**: Understand dependencies and coupling before refactoring
```bash
refakts analyze-coupling src/ --output coupling-graph.json
refakts analyze-dependencies file.ts --show-dependents
```
**Why Critical**: Informs refactoring decisions without requiring AI analysis
**Dependencies**: #4 (Query Engine)

#### 12. **Refactoring Impact Calculator**
**Status**: 🆕 Proposed  
**Description**: Calculate concrete metrics (not predictions) about refactoring impact
```bash
refakts impact-analysis --operation "extract-method" --target file.ts:45-67
# Output: "Will create 1 new function, reduce target function by 23 lines, affect 3 tests"
```
**Why Critical**: Concrete data for decision-making, not AI speculation
**Dependencies**: #5 (Method Extraction), #9 (Test Analysis)

---

## 🎭 Anti-Patterns (What We Won't Build)

These features rely on AI reasoning and shouldn't be automated:

❌ **Variable Name Suggestion**: AI agents already excel at contextual naming  
❌ **Code Quality Prediction**: AI can reason about quality better than algorithms  
❌ **Architectural Advice**: Strategic decisions require AI understanding  
❌ **Refactoring Strategy**: AI should decide what to refactor, tools should execute  

---

## 📈 Contributing to the Roadmap

### Adding Features
```bash
npm run roadmap:add --feature "feature-name" --description "What it does" --why "Why it's needed"
```

### Voting
```bash
npm run roadmap:vote --feature "regex-ast-locator"  # +1 vote
npm run roadmap:downvote --feature "unused-feature"  # -1 vote
```

### Reviewing
```bash
npm run roadmap:status  # Show all features with scores
npm run roadmap:top 5   # Show top 5 most-wanted features
```

## 🏗️ Implementation Notes

- **Start with Tier 1**: Foundation tools enable everything else
- **Each tool should be <10 lines to use**: Complex operations should feel simple
- **Sub-second response time**: AI agents need immediate feedback
- **Chainable by design**: Every operation should work with every other operation
- **Fail fast with clear errors**: Better to abort early than corrupt code

---

*Last updated: 2025-07-02*  
*Next review: After next development session*