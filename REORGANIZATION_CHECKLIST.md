# RefakTS Reorganization Checklist

This checklist tracks the systematic reorganization of the RefakTS codebase into a purpose-driven directory structure.

## Purpose of the reorganization

- The original architecture was a bit haphazard, and hard to follow. We want to clean that up. As a first step we reorganize files on a best effort basis.
- We want to test the new move-file command to see if there are any remaining bugs. 

**CRITICAL**: When there is a bug, always prioritise fixing it. Best way to do that is to `git reset --hard HEAD` to the last commit and fix the bug before moving on. Fix the bug in `main`, then rebase `reorganize-codebase-clean` onto it. 

## Overview

**Target Structure (relative to src/):**
- `command-line-parser/` - CLI argument parsing and command registration
- `core/` - Self-contained core refactoring functionality
  - `core/ast/` - Core AST operations and types (self-contained)
  - `core/services/` - Utility classes supporting locators/transformations
  - `core/locators/` - Find files and AST nodes based on search conditions
  - `core/transformations/` - Modify codebase (atomic or complex sequences)
  - `core/commands/` - Lightweight command orchestrators
- `output-formatter/` - Format output to human-readable format
- `dev/` - Development tools
  - `dev/quality/` - Code quality detection
  - `dev/roadmap/` - Roadmap voting system

**Principles:**
- ✅ Interfaces live next to classes that use them (dependency inversion)
- ✅ All files converted to snake-case naming
- ✅ Move one file at a time, test after each move
- ✅ Create GitHub issue and revert if anything breaks

---

## Progress Tracking

**Total Files:** 143 files to move/rename
**Completed:** 89 files ✅ (58.9%)
**Remaining:** 62 files
**Status:** ✅ **READY** - move-file command bug fixed

---

## File Moves Checklist

### 🔧 command-line-parser/ (CLI argument parsing and command registration)

- [x] `cli.ts` → `command-line-parser/cli.ts` ✅
- [x] `cli-generator.ts` → `command-line-parser/cli-generator.ts` ✅
- [x] `index.ts` → `command-line-parser/index.ts` ✅

### ⚙️ core/commands/ (Lightweight command orchestrators)

- [x] `command-registry.ts` → `core/commands/command-registry.ts` ✅
- [x] `command.ts` → `core/commands/command.ts` ✅
- [x] `commands/extract-variable-command.ts` → `core/commands/extract-variable-command.ts` ✅
- [x] `commands/extract-variable-options.json` → `core/commands/extract-variable-options.json` ✅
- [x] `commands/find-usages-command.ts` → `core/commands/find-usages-command.ts` ✅
- [x] `commands/find-usages-options.json` → `core/commands/find-usages-options.json` ✅
- [x] `commands/find-usages.help.txt` → `core/commands/find-usages.help.txt` ✅
- [x] `commands/inline-variable-command.ts` → `core/commands/inline-variable-command.ts` ✅
- [x] `commands/inline-variable-options.json` → `core/commands/inline-variable-options.json` ✅
- [x] `commands/move-file-command.ts` → `core/commands/move-file-command.ts` ✅
- [x] `commands/move-file-options.json` → `core/commands/move-file-options.json` ✅
- [x] `commands/move-file.help.txt` → `core/commands/move-file.help.txt` ✅
- [x] `commands/move-method-command.ts` → `core/commands/move-method-command.ts` ✅
- [x] `commands/move-method-options.json` → `core/commands/move-method-options.json` ✅
- [x] `commands/rename-command.ts` → `core/commands/rename-command.ts` ✅
- [x] `commands/rename-options.json` → `core/commands/rename-options.json` ✅
- [x] `commands/select-command.ts` → `core/commands/select-command.ts` ✅
- [x] `commands/select-options.json` → `core/commands/select-options.json` ✅
- [x] `commands/sort-methods-command.ts` → `core/commands/sort-methods-command.ts` ✅
- [x] `commands/sort-methods-options.json` → `core/commands/sort-methods-options.json` ✅

### 🔸 core/ast/ (Core AST operations and types)

- [x] `services/ast-service.ts` → `core/ast/ast-service.ts` ✅
- [x] `core/location-range.ts` → `core/ast/location-range.ts` ✅ *(move to eliminate AST→Services dependency)*
- [x] `locators/node-position-helper.ts` → `core/ast/node-position-helper.ts` ✅
- [x] `locators/node-type-classifier.ts` → `core/ast/node-type-classifier.ts` ✅

### 🔍 core/locators/ (Find files and AST nodes based on search conditions) ✅

- [x] `locators/VariableNameOperations.ts` → `core/locators/variable-name-operations.ts` ✅ *rename*
- [x] `locators/declaration-finder.ts` → `core/locators/declaration-finder.ts` ✅
- [x] `locators/position-finder.ts` → `core/locators/position-finder.ts` ✅
- [x] `locators/position-service.ts` → `core/locators/position-service.ts` ✅
- [x] `locators/variable-locator.ts` → `core/locators/variable-locator.ts` ✅
- [x] `locators/variable-node-matcher.ts` → `core/locators/variable-node-matcher.ts` ✅
- [x] `locators/variable-result-builder.ts` → `core/locators/variable-result-builder.ts` ✅

**Type Files (used by locators):**
- [x] `core/position-data.ts` → `core/locators/position-data.ts` ✅
- [x] `core/shadowing-analysis-request.ts` → `core/locators/shadowing-analysis-request.ts` ✅
- [x] `core/variable-context.ts` → `core/locators/variable-context.ts` ✅

### 🔄 core/transformations/ (Modify codebase - atomic or complex sequences) ✅

- [x] `transformations/rename-variable-transformation.ts` → `core/transformations/rename-variable-transformation.ts` ✅
- [x] `transformations/transformation.ts` → `core/transformations/transformation.ts` ✅
- [x] `services/method-sorter.ts` → `core/transformations/method-sorter.ts` ✅
- [x] `services/move-file-service.ts` → `core/transformations/move-file-service.ts` ✅
- [x] `services/statement-inserter.ts` → `core/transformations/statement-inserter.ts` ✅
- [x] `services/variable-replacer.ts` → `core/transformations/variable-replacer.ts` ✅

### 🛠️ core/services/ (Utility classes supporting locators/transformations)

**Main Services:**

- [x] `services/boundary-analyzer.ts` → `core/services/boundary-analyzer.ts` ✅
- [x] `services/class-method-finder.ts` → `core/services/class-method-finder.ts` ✅
- [x] `services/context-analyzer.ts` → `core/services/context-analyzer.ts` ✅
- [x] `services/cross-file-reference-finder.ts` → `core/services/cross-file-reference-finder.ts` ✅
- [x] `services/expression-analyzer.ts` → `core/services/expression-analyzer.ts` ✅
- [x] `services/expression-matcher.ts` → `core/services/expression-matcher.ts` ✅
- [x] `services/extraction-scope-analyzer.ts` → `core/services/extraction-scope-analyzer.ts` ✅
- [x] `services/file-system-helper.ts` → `core/services/file-system/helper.ts` ✅
- [x] `services/file-system-wrapper.ts` → `core/services/file-system/wrapper.ts` ✅
- [x] `utils/directory-utils.ts` → `core/services/file-system/directory.ts` ✅ *rename*
- [x] `services/error-utils.ts` → `core/services/file-system/error-utils.ts` ✅
- [x] `services/file-validator.ts` → `core/services/file-validator.ts` ✅
- [x] `services/moved-file-import-updater.ts` → `core/services/moved-file-import-updater.ts` ✅
- [x] `services/import-reference-service.ts` → `core/services/import-reference-service.ts` ✅
- [x] `services/method-dependency-analyzer.ts` → `core/services/method-dependency-analyzer.ts` ✅
- [x] `services/position-converter.ts` → `core/services/position-converter.ts` ✅
- [x] `services/project-scope-service.ts` → `core/services/project-scope-service.ts` ✅
- [x] `services/range-analysis-request.ts` → `core/services/range-analysis-request.ts` ✅
- [x] `services/range-analyzer.ts` → `core/services/range-analyzer.ts` ✅
- [x] `services/structural-analyzer.ts` → `core/services/structural-analyzer.ts` ✅
- [x] `services/usage-finder-service.ts` → `core/services/usage-finder-service.ts` ✅
- [x] `services/usage-type-analyzer.ts` → `core/services/usage-type-analyzer.ts` ✅
- [x] `services/variable-declaration-finder.ts` → `core/services/variable-declaration-finder.ts` ✅
- [x] `services/variable-name-validator.ts` → `core/services/variable-name-validator.ts` ✅
- [x] `services/variable-reference-request.ts` → `core/services/variable-reference-request.ts` ✅
- [x] `locators/scope-analyzer.ts` → `core/services/scope-analyzer.ts` ✅
- [x] `locators/shadowing-analyzer.ts` → `core/services/shadowing-analyzer.ts` ✅
- [x] `locators/shadowing-detector.ts` → `core/services/shadowing-detector.ts` ✅
- [x] `locators/source-file-helper.ts` → `core/services/source-file-helper.ts` ✅
- [x] `locators/usage-type-detector.ts` → `core/services/usage-type-detector.ts` ✅

**Core Type Files (widely used):**
- [x] `core/usage-collection.ts` → `core/services/usage-collection.ts` ✅
- [x] `locators/node-analyzer.ts` → `core/services/node-analyzer.ts` *(service facade, not core AST)* ✅
- [S] `locators/node-context.ts` **MERGE WITH** `core/node-context.ts` → `core/services/node-context.ts` *(unified context service)*


**Locator Services:**
- [x] `locators/services/index.ts` → `core/services/locators/index.ts` ✅
- [x] `locators/services/node-assignment-analyzer.ts` → `core/services/locators/node-assignment-analyzer.ts` ✅
- [x] `locators/services/node-declaration-matcher.ts` → `core/services/locators/node-declaration-matcher.ts` ✅
- [x] `locators/services/node-position-service.ts` → `core/services/locators/node-position-service.ts` ✅
- [x] `locators/services/node-scope-analyzer.ts` → `core/services/locators/node-scope-analyzer.ts` ✅
- [x] `locators/services/variable-name-extractor.ts` → `core/services/locators/variable-name-extractor.ts` ✅

**Selection Services:**
- [x] `services/selection/definition-range-detector.ts` → `core/services/selection/definition-range-detector.ts` ✅
- [x] `strategies/boundary-selection-strategy.ts` → `core/services/selection/boundary-selection-strategy.ts` ✅
- [ ] `strategies/range-selection-strategy.ts` → `core/services/selection/range-selection-strategy.ts`
- [ ] `strategies/regex-selection-strategy.ts` → `core/services/selection/regex-selection-strategy.ts`
- [ ] `strategies/selection-strategy-factory.ts` → `core/services/selection/selection-strategy-factory.ts`
- [ ] `strategies/selection-strategy.ts` → `core/services/selection/selection-strategy.ts`
- [ ] `strategies/structural-selection-strategy.ts` → `core/services/selection/structural-selection-strategy.ts`

**Selection Type Files:**
- [ ] `types/selection-types.ts` → `core/services/selection/selection-types.ts`

### 📊 command-line-parser/output-formatter/ (Format output to human-readable format)

**Main Output Handlers:**
- [ ] `services/move-file-output-handler.ts` → `command-line-parser/output-formatter/move-file-output-handler.ts`
- [ ] `services/selection/output-handler.ts` → `command-line-parser/output-formatter/selection-output-handler.ts`
- [ ] `services/selection/result-formatters.ts` → `command-line-parser/output-formatter/result-formatters.ts`
- [ ] `services/usage-output-handler.ts` → `command-line-parser/output-formatter/usage-output-handler.ts`
- [ ] `services/selection/match-context.ts` → `command-line-parser/output-formatter/match-context.ts`

**Pattern Matching & Formatting Services:**
- [ ] `services/regex-pattern-matcher.ts` → `command-line-parser/output-formatter/services/regex-pattern-matcher.ts` *(output formatting, not core service)*
- [ ] `services/selection/pattern-matcher.ts` → `command-line-parser/output-formatter/services/pattern-matcher.ts` *(output formatting logic)*

**Context Classes:**
- [ ] `services/selection/contexts/line-processing-context.ts` → `command-line-parser/output-formatter/contexts/line-processing-context.ts`
- [ ] `services/selection/contexts/match-build-context.ts` → `command-line-parser/output-formatter/contexts/match-build-context.ts`
- [ ] `services/selection/contexts/match-details-context.ts` → `command-line-parser/output-formatter/contexts/match-details-context.ts`
- [ ] `services/selection/contexts/processing-context.ts` → `command-line-parser/output-formatter/contexts/processing-context.ts`
- [ ] `services/selection/contexts/select-match-context.ts` → `command-line-parser/output-formatter/contexts/select-match-context.ts`

**Console Interfaces:**
- [ ] `interfaces/ConsoleOutput.ts` → `command-line-parser/output-formatter/console-output.ts` *rename*
- [ ] `interfaces/FakeConsole.ts` → `command-line-parser/output-formatter/fake-console.ts` *rename*
- [ ] `interfaces/StandardConsole.ts` → `command-line-parser/output-formatter/standard-console.ts` *rename*



### 🛠️ dev/ (Development tools)

**Documentation Tools:**
- [ ] `documentation/DocumentationUpdater.ts` → `dev/documentation-updater.ts` *rename*
- [ ] `documentation/FileManager.ts` → `dev/file-manager.ts` *rename*
- [ ] `documentation/HelpContentExtractor.ts` → `dev/help-content-extractor.ts` *rename*
- [ ] `documentation/QualityChecksExtractor.ts` → `dev/quality-checks-extractor.ts` *rename*
- [ ] `documentation/SectionReplacer.ts` → `dev/section-replacer.ts` *rename*
- [ ] `documentation/formatters/ClaudeFormatter.ts` → `dev/formatters/claude-formatter.ts` *rename*
- [ ] `documentation/formatters/ReadmeFormatter.ts` → `dev/formatters/readme-formatter.ts` *rename*

**Scripts:**
- [ ] `update-docs.ts` → `dev/update-docs.ts`
- [ ] `usage-tracker.ts` → `dev/usage-tracker.ts`
- [ ] `snooze-cli.ts` → `dev/snooze-cli.ts`

**Type Files (used by dev tools):**
- [ ] `core/section-replacement-request.ts` → `dev/section-replacement-request.ts`

**Files to Delete:**
- [ ] `moved-test.ts` → **DELETE** *(leftover test file)*

### 🔍 dev/quality/ (Code quality detection)

**Main Quality Tools:**
- [ ] `quality-tools/baseline-cli.ts` → `dev/quality/baseline-cli.ts`
- [ ] `quality-tools/baseline-file-io.ts` → `dev/quality/baseline-file-io.ts`
- [ ] `quality-tools/baseline-git.ts` → `dev/quality/baseline-git.ts`
- [ ] `quality-tools/baseline-manager.ts` → `dev/quality/baseline-manager.ts`
- [ ] `quality-tools/baseline-types.ts` → `dev/quality/baseline-types.ts`
- [ ] `quality-tools/baseline-violations.ts` → `dev/quality/baseline-violations.ts`
- [ ] `quality-tools/glob-resolver.ts` → `dev/quality/glob-resolver.ts`
- [ ] `quality-tools/plugin-loader.ts` → `dev/quality/plugin-loader.ts`
- [ ] `quality-tools/quality-check-interface.ts` → `dev/quality/quality-check-interface.ts`
- [ ] `quality-tools/quality-reporter.ts` → `dev/quality/quality-reporter.ts`
- [ ] `quality-tools/quality-runner.ts` → `dev/quality/quality-runner.ts`
- [ ] `quality-tools/quality-watcher.sh` → `dev/quality/quality-watcher.sh`
- [ ] `quality-tools/report-functions.ts` → `dev/quality/report-functions.ts`
- [ ] `quality-tools/snooze-tracker.ts` → `dev/quality/snooze-tracker.ts`

**Quality Checks:**
- [ ] `quality-tools/checks/change-frequency-check.ts` → `dev/quality/checks/change-frequency-check.ts`
- [ ] `quality-tools/checks/comment-check.ts` → `dev/quality/checks/comment-check.ts`
- [ ] `quality-tools/checks/complexity-check.ts` → `dev/quality/checks/complexity-check.ts`
- [ ] `quality-tools/checks/duplication-check.ts` → `dev/quality/checks/duplication-check.ts`
- [ ] `quality-tools/checks/feature-envy-check.ts` → `dev/quality/checks/feature-envy-check.ts`
- [ ] `quality-tools/checks/file-size-check.ts` → `dev/quality/checks/file-size-check.ts`
- [ ] `quality-tools/checks/function-size-check.ts` → `dev/quality/checks/function-size-check.ts`
- [ ] `quality-tools/checks/git-diff-check.ts` → `dev/quality/checks/git-diff-check.ts`
- [ ] `quality-tools/checks/linter-check.ts` → `dev/quality/checks/linter-check.ts`
- [ ] `quality-tools/checks/unused-method-check.ts` → `dev/quality/checks/unused-method-check.ts`

**Quality Check Services:**
- [ ] `quality-tools/checks/services/feature-envy-detector.ts` → `dev/quality/services/feature-envy-detector.ts`
- [ ] `quality-tools/checks/services/import-symbol-extractor.ts` → `dev/quality/services/import-symbol-extractor.ts`
- [ ] `quality-tools/checks/services/index.ts` → `dev/quality/checks/index.ts`
- [ ] `quality-tools/checks/services/method-usage-analyzer.ts` → `dev/quality/checks/method-usage-analyzer.ts`

**Type Files (used by quality tools):**
- [ ] `core/usage-analysis-request.ts` → `dev/quality/usage-analysis-request.ts`

### 🗺️ dev/roadmap/ (Roadmap voting system)

- [x] `roadmap/index.ts` → `dev/roadmap/index.ts` ✅
- [x] `roadmap/roadmap-cli.ts` → `dev/roadmap/roadmap-cli.ts` ✅
- [x] `roadmap/roadmap-display.ts` → `dev/roadmap/roadmap-display.ts` ✅
- [x] `roadmap/roadmap-service.ts` → `dev/roadmap/roadmap-service.ts` ✅
- [x] `roadmap/roadmap-storage.ts` → `dev/roadmap/roadmap-storage.ts` ✅
- [x] `roadmap/types.ts` → `dev/roadmap/types.ts` ✅

### 🏛️ Files Staying in Core (minimal/foundational usage)

- [x] `core/scope-context.ts` → `core/scope-context.ts` *(keep in place - minimal usage)* ✅

---

## Implementation Notes

### 🧪 Testing Strategy

1. Move groups of files one by one using `refakts move-file` command
2. Run `npm test` after each move to ensure nothing breaks
3. If tests fail, investigate and create GitHub issue
4. If cannot be fixed quickly, revert the move and document the issue
5. Continue with next file

### 📝 After Completion

- [ ] Run full test suite to ensure everything works
- [ ] Update CLAUDE.md with new architecture documentation

---

## Progress Log

### 📈 Session 2025-07-23 

#### ✅ **REORGANIZATION RESET** - Ready to Start Clean
- **Previous Status**: Had completed 6/143 files but discovered critical move-file bug
- **Bug Fix**: Fixed move-file command to properly update imports within moved files
  - Added MovedFileImportUpdater service class
  - Added comprehensive fixture tests for the fix
  - Updated existing test expectations to include moved files in output
- **Current Status**: ✅ **READY** - All tools working correctly, can proceed with full reorganization
- **Method**: Will use `refakts move-file` command with confidence that import updates work properly

#### 📊 **Overall Progress**
- **Completed**: 0/143 files (0%) - Reset to clean slate
- **Tools Status**: ✅ move-file command fully functional including import updates
- **Quality**: ✅ Bug fix includes proper test coverage to prevent regression
- **Value delivered**: 🎯 **Tool improvement through dogfooding** - RefakTS now more reliable for AI agents

---

#### ✅ **CORE DIRECTORIES COMPLETED** - Session 2025-07-23 Evening

**Major Progress Made:**
- **Fixed architectural bug**: Circular dependency between NodeContext and ShadowingAnalysisRequest
  - Created ShadowingAnalysisRequestFactory to break the cycle
  - Fixed rename functionality that was broken during reorganization
- **Completed core/locators/ (10 files)**: All locator files and type files moved successfully
- **Completed core/transformations/ (6 files)**: All transformation files moved successfully  
- **Started core/services/ (2 files)**: statement-inserter.ts and variable-replacer.ts moved
- **Quality improvements**: Split oversized test file, removed all comments, extracted helper functions

**Current Status**: 
- **Completed**: 50/143 files (35.0%) ✅ +17 files from previous session
- **Tools Status**: ✅ All functionality tested and working (rename, extract-variable, inline-variable, method-sorter, move-file)
- **Quality**: ✅ All quality checks passing
- **Architecture**: ✅ Fixed critical circular dependency issue that was discovered during moves

**Key Lessons:**
- Moving files revealed architectural issues that needed immediate fixing
- The move-file command has a bug (#52) where it doesn't update require() statements
- Quality system successfully caught and enforced fixes for oversized files and comments

**Next Group**: Continue with core/services/ directory (91 remaining files)

### 🎯 **Next Session Tasks**
1. **Continue core/services/**: Move the remaining core service files systematically
2. **Test thoroughly**: Run tests after each group move to ensure stability
3. **Document progress**: Update checklist as we complete each section
4. **Commit the changes**: Once all steps are complete commit the change
5. **STOP**: I (Ivett) want to review each commit before moving on. 