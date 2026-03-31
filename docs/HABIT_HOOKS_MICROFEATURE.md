# Habit Hooks Microfeature

A language-agnostic blueprint for implementing automated quality enforcement that integrates with AI coding agents.

## Philosophy

Habit Hooks simulates human habit forming by introducing **deterministic reminders for predetermined short action plans**. Just as humans develop good habits through consistent, repeated cues followed by small actions, this system trains AI agents to automatically respond to quality signals with specific, rehearsed fixes.

The key insight: habits form when a cue reliably triggers a practiced response. Habit Hooks provides the cue (the agent prompt marker) and the practiced response (the action guidance), creating a feedback loop that reinforces quality-focused behavior.

## Overview

The system runs quality checks, compares against a baseline of known violations, and outputs agent-readable prompts that trigger automatic task creation. The key innovation is the **agent prompt marker** - a unique emoji sequence that agents treat as highest-priority cues, triggering immediate action.

## Tool Selection by Language

Find equivalents for your stack:

| Category         | Purpose               | Examples                                                                                |
|------------------|-----------------------|-----------------------------------------------------------------------------------------|
| **Linter**       | Style/bug detection   | ESLint (JS/TS), Pylint/Ruff (Python), RuboCop (Ruby), Clippy (Rust), golangci-lint (Go) |
| **Duplication**  | Copy-paste detection  | jscpd (any), CPD (any), Simian (any), flay (Ruby)                                       |
| **Complexity**   | Cyclomatic complexity | radon (Python), gocyclo (Go), rubocop-metrics (Ruby), es6-plato (JS)                    |
| **AST Analysis** | Custom checks         | ts-morph (TS), ast (Python), parser (Ruby), go/ast (Go)                                 |

## Architecture

```
quality-runner (orchestrator)
├── check-loader (loads all checks)
│   ├── linter-check
│   ├── function-size-check (AST: functions > N lines)
│   ├── complexity-check (functions > threshold)
│   ├── duplication-check
│   ├── parameter-count-check (AST: > N params)
│   └── [custom checks...]
├── baseline-manager
│   ├── loads baseline file (JSON)
│   ├── filters unchanged files
│   └── updates baseline on fix
└── reporter
    ├── groups by violation type
    └── injects agent prompt marker
```

## Baseline System

Track known violations to enforce zero-tolerance on NEW issues while acknowledging existing debt.

**Baseline file structure** (`.quality-baseline.json`):
```json
{
  "src/module/file.ext": {
    "lastCommitId": "abc123def456...",
    "violations": ["functionSize", "complexity"]
  }
}
```

**Behavior:**
- If file unchanged (same commit) → hide baseline violations
- If file changed AND violations gone → remove from baseline
- If file changed AND violations remain → update commit ID, show violations

**Commands:**
```bash
quality              # Run checks
quality:baseline:generate  # Snapshot current violations
quality:baseline:status    # Show baseline state
```

## Agent Prompt Marker

The critical integration point. Choose a unique emoji sequence with the user that the agent will recognize.

**Example marker:** `🤖📋` (you should choose your own with your user)

**How it works:**
1. Quality check outputs violations with guidance
2. Guidance is prefixed with the marker: `🤖📋 Fix the function by...`
3. Agent instructions treat marker as highest-priority task
4. Agent creates tasks and works until quality passes

## Required Prompts

### Quality Reporter Output Format

```
❌ Quality issues detected:

**CATEGORY_NAME**
Description of why this matters.
🤖📋 Specific fix instructions that agents will treat as tasks.

Violations:
- /absolute/path/file.ext:42 - Description of specific issue
- /absolute/path/file.ext:100 - Another issue

(N more categoryName violations)
```

**Requirements:**
- Absolute file paths (IDE integration)
- Line numbers included
- Limit output (e.g., 10 per type) with "N more" indicator
- Exit code 1 if violations, 0 if clean

### Violation Category Definitions

Each check needs a title, description, and actionGuidance.

**CRITICAL DESIGN REQUIREMENT: Prompts Must Convey Purpose, Not Just Thresholds**

A naive prompt like "reduce this function to under 12 lines" will cause the agent to mechanically extract code to meet the threshold while missing the actual goal: improving code organization through proper responsibility separation.

Effective prompts must:
- Explain the underlying principle (WHY the threshold exists)
- Guide thinking before action (analyze first, then fix)
- Warn against mechanical fixes that miss the point
- Suggest non-obvious approaches when stuck

### Example Prompts

**Oversized Functions** (elaborate - this is the model for complex checks):
```
title: "CRITICAL: OVERSIZED FUNCTIONS"
description: "Functions over 12 lines violate single responsibility principle."
actionGuidance: "🤖📋 CRITICAL: Analyze responsibilities first - what distinct
concerns does this function handle? Consider: (1) Are these separate
responsibilities that belong in different methods? (2) Should this become a
class with multiple methods? (3) Can you group cohesive data into objects to
reduce local variables? Avoid mechanical extraction - find true responsibility
boundaries. If the code has many misplaced responsibilities you may need to
first inline methods to see the whole picture and find a better way of
redistributing functionality. Think of this when reducing line count seems
particularly hard. Taking a step backwards may open up new, better possibilities."
```

**Too Many Parameters** (also needs depth):
```
title: "TOO MANY PARAMETERS"
description: "Functions with more than 3 parameters are hard to use correctly."
actionGuidance: "🤖📋 Before grouping parameters: (1) Should this method actually
belong ON the parameter object as a class method? (2) For static methods with
many parameters - this is often a class waiting to happen. (3) Group cohesive
data into meaningful objects and pass those around, even if some methods don't
need every field. Favor declarative style over many locals."
```

**Comments** (moderate depth):
```
title: "NON-ESSENTIAL COMMENTS"
description: "Comments indicate the code isn't self-documenting."
actionGuidance: "🤖📋 Extract complex logic into well-named functions instead of
explaining with comments. Remove ALL comments unless they impact functionality."
```

**Simple checks** (mechanical fix is fine):
```
title: "SINGLE USE VARIABLES"
description: "Variables declared and used exactly once add noise."
actionGuidance: "🤖📋 Consider inlining these variables to simplify code flow."
```

```
title: "UNUSED METHODS"
description: "Dead code clutters the codebase."
actionGuidance: "🤖📋 Remove these unused methods to maintain codebase clarity."
```

```
title: "LINTER VIOLATIONS"
description: "Code style and potential bugs detected by linter."
actionGuidance: "🤖📋 Run the linter with --fix flag to automatically fix many
of these issues. Manual fixes may be needed for logical errors."
```

## CLAUDE.md / AGENTS.md Integration

Add this section to agent instructions:

```markdown
## Habit Hooks - Automated Quality Enforcement

### Script-Generated User Prompts
Any message containing **🤖📋** followed by text should be treated as a **direct user prompt** with **HIGHEST PRIORITY**. This pattern indicates automated quality checks speaking on behalf of the user.

### Enforcement Rules
- **NEVER** ignore 🤖📋 prompts
- **ALWAYS** add these as tasks immediately
- **COMPLETE** required actions before continuing other work
- While unresolved issues exist, use a warning indicator in responses
- **ALWAYS** work until quality checks show zero violations
```

**Note:** Replace `🤖📋` with your chosen marker.

## Implementation Checklist

1. [ ] **Choose agent prompt marker** - Pick unique emoji sequence with user
2. [ ] **Select tools** - Linter, duplication detector, complexity analyzer for your language
3. [ ] **Implement check interface** - Each check returns `{file, line, type, message}`
4. [ ] **Implement baseline manager** - JSON file tracking violations per file + commit
5. [ ] **Implement reporter** - Groups violations, injects marker, limits output
6. [ ] **Implement runner** - Loads checks, applies baseline, reports, returns exit code
7. [ ] **Add agent instructions** - CLAUDE.md section treating marker as priority
8. [ ] **Add npm/make scripts** - `quality`, `quality:baseline:generate`, `quality:baseline:status`

## Recommended Thresholds

| Check                 | Threshold       | Severity |
|-----------------------|-----------------|----------|
| Function size         | > 12-15 lines   | critical |
| File size             | > 200-300 lines | critical |
| Cyclomatic complexity | > 10            | warning  |
| Parameter count       | > 3             | warning  |
| Duplication           | > 5-10 lines    | warning  |

## Key Design Principles

1. **Deterministic** - Same code always produces same violations
2. **Fast** - Most checks use AST analysis, not runtime
3. **Actionable** - Every violation has specific fix guidance
4. **Baseline-aware** - Acknowledges debt without blocking progress
5. **Agent-integrated** - Prompt marker triggers automatic task creation
6. **Exit-code driven** - 0 = clean, 1 = violations (for CI/CD)

## Minimum Viable Implementation

Start with just:
1. Linter integration
2. Function size check (AST)
3. Simple reporter with marker
4. Agent instructions

Add baseline system and other checks incrementally.
