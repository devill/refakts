# RefakTS Reorganization Checklist

This checklist tracks the systematic reorganization of the RefakTS codebase into a purpose-driven directory structure.

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
**Completed:** 3 files ✅ (2.1%)
**Remaining:** 140 files
**Status:** ✅ **READY** - move-file command bug fixed

---

## File Moves Checklist

### 🔧 command-line-parser/ (CLI argument parsing and command registration)

- [x] `cli.ts` → `command-line-parser/cli.ts` ✅
- [x] `cli-generator.ts` → `command-line-parser/cli-generator.ts` ✅
- [x] `index.ts` → `command-line-parser/index.ts` ✅

### ⚙️ core/commands/ (Lightweight command orchestrators)

- [ ] `command-registry.ts` → `core/commands/command-registry.ts`
- [ ] `command.ts` → `core/commands/command.ts`
- [ ] `commands/extract-variable-command.ts` → `core/commands/extract-variable-command.ts`
- [ ] `commands/extract-variable-options.json` → `core/commands/extract-variable-options.json`
- [ ] `commands/find-usages-command.ts` → `core/commands/find-usages-command.ts`
- [ ] `commands/find-usages-options.json` → `core/commands/find-usages-options.json`
- [ ] `commands/find-usages.help.txt` → `core/commands/find-usages.help.txt`
- [ ] `commands/inline-variable-command.ts` → `core/commands/inline-variable-command.ts`
- [ ] `commands/inline-variable-options.json` → `core/commands/inline-variable-options.json`
- [ ] `commands/move-file-command.ts` → `core/commands/move-file-command.ts`
- [ ] `commands/move-file-options.json` → `core/commands/move-file-options.json`
- [ ] `commands/move-file.help.txt` → `core/commands/move-file.help.txt`
- [ ] `commands/move-method-command.ts` → `core/commands/move-method-command.ts`
- [ ] `commands/move-method-options.json` → `core/commands/move-method-options.json`
- [ ] `commands/rename-command.ts` → `core/commands/rename-command.ts`
- [ ] `commands/rename-options.json` → `core/commands/rename-options.json`
- [ ] `commands/select-command.ts` → `core/commands/select-command.ts`
- [ ] `commands/select-options.json` → `core/commands/select-options.json`
- [ ] `commands/sort-methods-command.ts` → `core/commands/sort-methods-command.ts`
- [ ] `commands/sort-methods-options.json` → `core/commands/sort-methods-options.json`

### 🔸 core/ast/ (Core AST operations and types)

- [ ] `services/ast-service.ts` → `core/ast/ast-service.ts`
- [ ] `core/location-range.ts` → `core/ast/location-range.ts` *(move to eliminate AST→Services dependency)*
- [ ] `locators/node-position-helper.ts` → `core/ast/node-position-helper.ts`
- [ ] `locators/node-type-classifier.ts` → `core/ast/node-type-classifier.ts`

### 🔍 core/locators/ (Find files and AST nodes based on search conditions)

- [ ] `locators/VariableNameOperations.ts` → `core/locators/variable-name-operations.ts` *rename*
- [ ] `locators/declaration-finder.ts` → `core/locators/declaration-finder.ts`
- [ ] `locators/position-finder.ts` → `core/locators/position-finder.ts`
- [ ] `locators/position-service.ts` → `core/locators/position-service.ts`
- [ ] `locators/variable-locator.ts` → `core/locators/variable-locator.ts`
- [ ] `locators/variable-node-matcher.ts` → `core/locators/variable-node-matcher.ts`
- [ ] `locators/variable-result-builder.ts` → `core/locators/variable-result-builder.ts`

**Type Files (used by locators):**
- [ ] `core/position-data.ts` → `core/locators/position-data.ts`
- [ ] `core/shadowing-analysis-request.ts` → `core/locators/shadowing-analysis-request.ts`
- [ ] `core/variable-context.ts` → `core/locators/variable-context.ts`

### 🔄 core/transformations/ (Modify codebase - atomic or complex sequences)

- [ ] `transformations/rename-variable-transformation.ts` → `core/transformations/rename-variable-transformation.ts`
- [ ] `transformations/transformation.ts` → `core/transformations/transformation.ts`
- [ ] `services/method-sorter.ts` → `core/transformations/method-sorter.ts`
- [ ] `services/move-file-service.ts` → `core/transformations/move-file-service.ts`
- [ ] `services/statement-inserter.ts` → `core/services/statement-inserter.ts`
- [ ] `services/variable-replacer.ts` → `core/services/variable-replacer.ts`

### 🛠️ core/services/ (Utility classes supporting locators/transformations)

**Main Services:**

- [ ] `services/boundary-analyzer.ts` → `core/services/boundary-analyzer.ts`
- [ ] `services/class-method-finder.ts` → `core/services/class-method-finder.ts`
- [ ] `services/context-analyzer.ts` → `core/services/context-analyzer.ts`
- [ ] `services/cross-file-reference-finder.ts` → `core/services/cross-file-reference-finder.ts`
- [ ] `services/expression-analyzer.ts` → `core/services/expression-analyzer.ts`
- [ ] `services/expression-matcher.ts` → `core/services/expression-matcher.ts`
- [ ] `services/extraction-scope-analyzer.ts` → `core/services/extraction-scope-analyzer.ts`
- [ ] `services/file-system-helper.ts` → `core/services/file-system/helper.ts`
- [ ] `services/file-system-wrapper.ts` → `core/services/file-system/wrapper.ts`
- [ ] `utils/directory-utils.ts` → `core/services/file-system/directory.ts` *rename*
- [ ] `services/error-utils.ts` → `core/services/file-system/error-utils.ts`
- [ ] `services/file-validator.ts` → `core/services/file-validator.ts`
- [ ] `services/moved-file-import-updater.ts` → `core/services/moved-file-import-updater.ts`
- [ ] `services/import-reference-service.ts` → `core/services/import-reference-service.ts`
- [ ] `services/method-dependency-analyzer.ts` → `core/services/method-dependency-analyzer.ts`
- [ ] `services/position-converter.ts` → `core/services/position-converter.ts`
- [ ] `services/project-scope-service.ts` → `core/services/project-scope-service.ts`
- [ ] `services/range-analysis-request.ts` → `core/services/range-analysis-request.ts`
- [ ] `services/range-analyzer.ts` → `core/services/range-analyzer.ts`
- [ ] `services/structural-analyzer.ts` → `core/services/structural-analyzer.ts`
- [ ] `services/usage-finder-service.ts` → `core/services/usage-finder-service.ts`
- [ ] `services/usage-type-analyzer.ts` → `core/services/usage-type-analyzer.ts`
- [ ] `services/variable-declaration-finder.ts` → `core/services/variable-declaration-finder.ts`
- [ ] `services/variable-name-validator.ts` → `core/services/variable-name-validator.ts`
- [ ] `services/variable-reference-request.ts` → `core/services/variable-reference-request.ts`
- [ ] `locators/scope-analyzer.ts` → `core/services/scope-analyzer.ts`
- [ ] `locators/shadowing-analyzer.ts` → `core/services/shadowing-analyzer.ts`
- [ ] `locators/shadowing-detector.ts` → `core/services/shadowing-detector.ts`
- [ ] `locators/source-file-helper.ts` → `core/services/source-file-helper.ts`
- [ ] `locators/usage-type-detector.ts` → `core/services/usage-type-detector.ts`

**Core Type Files (widely used):**
- [ ] `core/usage-collection.ts` → `core/services/usage-collection.ts`
- [ ] `locators/node-analyzer.ts` → `core/services/node-analyzer.ts` *(service facade, not core AST)*
- [ ] `locators/node-context.ts` **MERGE WITH** `core/node-context.ts` → `core/services/node-context.ts` *(unified context service)*


**Locator Services:**
- [ ] `locators/services/index.ts` → `core/services/locators/index.ts`
- [ ] `locators/services/node-assignment-analyzer.ts` → `core/services/locators/node-assignment-analyzer.ts`
- [ ] `locators/services/node-declaration-matcher.ts` → `core/services/locators/node-declaration-matcher.ts`
- [ ] `locators/services/node-position-service.ts` → `core/services/locators/node-position-service.ts`
- [ ] `locators/services/node-scope-analyzer.ts` → `core/services/locators/node-scope-analyzer.ts`
- [ ] `locators/services/variable-name-extractor.ts` → `core/services/locators/variable-name-extractor.ts`

**Selection Services:**
- [ ] `services/selection/definition-range-detector.ts` → `core/services/selection/definition-range-detector.ts`
- [ ] `strategies/boundary-selection-strategy.ts` → `core/services/selection/boundary-selection-strategy.ts`
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

- [ ] `roadmap/index.ts` → `dev/roadmap/index.ts`
- [ ] `roadmap/roadmap-cli.ts` → `dev/roadmap/roadmap-cli.ts`
- [ ] `roadmap/roadmap-display.ts` → `dev/roadmap/roadmap-display.ts`
- [ ] `roadmap/roadmap-service.ts` → `dev/roadmap/roadmap-service.ts`
- [ ] `roadmap/roadmap-storage.ts` → `dev/roadmap/roadmap-storage.ts`
- [ ] `roadmap/types.ts` → `dev/roadmap/types.ts`

### 🏛️ Files Staying in Core (minimal/foundational usage)

- [ ] `core/scope-context.ts` → `core/scope-context.ts` *(keep in place - minimal usage)*

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

### 🎯 **Next Session Tasks**
1. **Start reorganization**: Begin with low-impact directories (dev/roadmap first)
2. **Test thoroughly**: Run tests after each move to ensure stability
3. **Document progress**: Update checklist as we complete each section