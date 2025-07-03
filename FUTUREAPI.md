# RefakTS Future API Design

## Core Philosophy: Location-Based Selection

All refactoring operations work with **stateless location specifiers** that precisely identify code ranges. The `select` command finds matches and returns location descriptors that other commands can use directly.

## Location Format

RefakTS uses a standardized location format:

```
[filename.ts line:column-line:column]  # Character-precise selection
[filename.ts line:-line:]              # Full line selection  
[filename.ts line:column-]             # From position to end of line
[filename.ts line-line:column]         # From line start to position
```

**Examples:**
- `[src/calc.ts 10:3-10:15]` - Characters 3-15 on line 10
- `[src/calc.ts 13:-15:]` - Complete lines 13-15  
- `[src/calc.ts 14:5-15:20]` - From line 14 col 5 to line 15 col 20

## Selection Command

The `select` command finds code elements and returns their locations with content preview:

```bash
# Find variable declarations (single line - no closing bracket)
refakts select src/file.ts --regex "tempResult"
# Output:
# [src/file.ts 5:8-5:18] tempResult

# Find expressions (single line matches)
refakts select src/file.ts --regex "width.*height"
# Output:
# [src/file.ts 8:15-8:29] width * height
# [src/file.ts 12:20-12:34] width + height

# Find with full definition context (multi-line - with closing bracket)
refakts select src/file.ts --regex "calculateTotal" --include-definition
# Output:
# [src/file.ts 10:-15:]
# function calculateTotal(a: number, b: number): number {
#   const result = a + b;
#   return result;
# }
# [/src/file.ts 10:-15:]

# Include full line containing match
refakts select src/file.ts --regex "tempResult" --include-line
# Output:
# [src/file.ts 5:-5:] const tempResult = 42 * 2;

# Preview with line context but select precise match
refakts select src/file.ts --regex "tempResult" --preview-line
# Output:
# [src/file.ts 5:8-5:18] tempResult
# Context: const tempResult = 42 * 2;
```

## Refactoring Commands with Locations

All refactoring commands accept location specifiers:

### Point Operations (Single Target)
```bash
# Rename variable
refakts rename --to "newName" "[src/file.ts 5:8-5:18]"

# Inline variable  
refakts inline-variable "[src/file.ts 5:8-5:18]"

# Make method static
refakts make-method-static "[src/file.ts 10:-15:]"

# Convert method to non-static
refakts make-method-non-static "[src/file.ts 10:-15:]"
```

### Multi-Point Operations (Multiple Instances)
```bash
# Extract variable in multiple locations
refakts extract-variable --name "pi" "[src/file.ts 8:15-8:29]" "[src/file.ts 12:20-12:34]"

# Extract constant across files
refakts extract-constant --name "API_URL" "[src/a.ts 5:10-5:35]" "[src/b.ts 8:15-8:40]"

# Introduce destructuring for multiple property accesses
refakts introduce-destructuring "[src/file.ts 10:8-10:18]" "[src/file.ts 12:5-12:15]"
```

### Range Operations (Contiguous Code)
```bash
# Extract method from code block
refakts extract-method --name "calculateTotal" "[src/file.ts 15:-23:]"

# Extract parameter object from parameter list
refakts extract-parameter-object --name "Config" "[src/file.ts 5:25-5:85]"

# Transform parameter with wrapper
refakts transform-parameter --wrap-with "ConfigObject" "[src/file.ts 5:25-5:45]"
```

### Structural Operations (Related Elements)
```bash
# Extract superclass from common methods
refakts extract-superclass --name "BaseUser" "[src/user.ts 10:-15:]" "[src/user.ts 20:-25:]"

# Extract interface from class (name-based - more ergonomic)
refakts extract-interface --name "UserActions" --from-class "User" --methods "save,load,validate"

# Extract interface from method signatures (location-based)
refakts extract-interface --name "UserActions" "[src/file.ts 10:-12:]" "[src/file.ts 18:-20:]"

# Pull members up to superclass
refakts pull-members-up --to-class "BaseClass" "[src/file.ts 15:-18:]"

# Move method between classes (name-based)
refakts move-method-between-classes --method "calculateTotal" --from-class "Utils" --to-class "Calculator"

# Move method between classes (location-based)
refakts move-method-between-classes --to-class "TargetClass" "[src/file.ts 20:-25:]"
```

### Type Operations
```bash
# Extract type alias
refakts extract-type-alias --name "UserType" "[src/file.ts 5:15-5:45]"

# Extract interface from object type
refakts extract-interface --name "UserData" "[src/file.ts 8:20-8:65]"

# Convert export type
refakts convert-export-type --to-named "[src/file.ts 1:1-1:25]"
```

### Scope-Promotion Operations
```bash
# Extract field from local computation
refakts extract-field --name "computed" "[src/file.ts 15:10-15:25]"

# Extract parameter from local variable
refakts extract-parameter --name "threshold" "[src/file.ts 12:8-12:18]"
```

### API Evolution Operations
```bash
# Change function signature
refakts change-signature --add-param "newParam: string" "[src/file.ts 5:-5:]"

# Safe delete with impact analysis
refakts safe-delete "[src/file.ts 10:-15:]"
refakts safe-delete "[src/file.ts 10:-15:]" --dry-run  # Just show what would break
```

## Advanced Selection Features

### Definition Expansion
```bash
# Expand selection to full definition
refakts select src/file.ts --regex "(myFunction)" --include-definition
# Returns full function definition instead of just name match

# Works with variables, classes, methods, etc.
refakts select src/file.ts --regex "(MyClass)" --include-definition
# Returns entire class definition
```

### Multi-File Selection
```bash
# Select across multiple files
refakts select src/*.ts --regex "(UserInterface)"
# Returns locations in all matching files

# Cross-file refactoring
refakts rename --to "PersonInterface" "[src/user.ts 5:10-5:23]" "[src/admin.ts 8:15-8:28]"
```

### Smart Boundary Detection
```bash
# Select with intelligent boundaries
refakts select src/file.ts --range --start-regex "const.*=" --end-regex "return.*"
# Finds complete statement blocks

# Select related elements
refakts select src/file.ts --structural --regex ".*[Uu]ser.*" --include-methods --include-fields
# Returns all user-related methods and fields

# Function-scoped boundary selection
refakts select src/file.ts --regex "user.*" --boundaries "function"
# Returns matches within intelligent function boundaries
```

## Utility Commands

### Import Management
```bash
# Organize imports after refactoring
refakts auto-import-organizer src/file.ts

# Update imports when moving code
refakts auto-import-organizer src/file.ts --update-imports
```

### Selection Tool (Foundation)
```bash
# Advanced selection with boundaries
refakts select src/file.ts --regex "pattern" --boundaries "function"
# Returns selections respecting function boundaries

# Multi-pattern selection
refakts select src/file.ts --regex "pattern1" --regex "pattern2"
# Returns all matches for both patterns
```

## Command Interface Options

Commands support both **location-based** and **name-based** interfaces depending on what's most ergonomic:

### Location-Based (Precise Control)
```bash
# Current API (still supported)
refakts inline-variable src/file.ts --regex "pattern"

# New location-based API
refakts select src/file.ts --regex "pattern"
# → [src/file.ts 5:8-5:18] tempResult
refakts inline-variable "[src/file.ts 5:8-5:18]"

# Single command with preview
refakts inline-variable src/file.ts --regex "pattern" --preview
# Shows location and content before applying
```

### Name-Based (Ergonomic for Structural Operations)
```bash
# Extract interface by specifying class and method names
refakts extract-interface --name "Drawable" --from-class "Shape" --methods "draw,move,resize"

# Rename across entire codebase by name
refakts rename --from "OldClassName" --to "NewClassName" --type "class"

# Move method by name (finds automatically)
refakts move-method --method "validateUser" --from-class "Utils" --to-class "UserService"

# Change signature by function name
refakts change-signature --function "processData" --add-param "options: Config"
```

### Hybrid Approach
Many commands support both interfaces for maximum flexibility:

```bash
# Location-based precision
refakts extract-method --name "helper" "[src/file.ts 15:-23:]"

# Name-based convenience  
refakts extract-method --name "helper" --from-function "processData" --lines "15-23"
```

## Key Benefits

1. **Stateless**: No persistent state - locations are self-contained
2. **Precise**: Character-level accuracy with clear boundaries
3. **Composable**: Chain operations with explicit location control
4. **Readable**: Human-readable location format
5. **Scriptable**: Easy to parse and generate programmatically
6. **Multi-file**: Natural support for cross-file operations
7. **Reliable**: Locations are deterministic and reproducible

This location-based design provides surgical precision for AI agents while maintaining simplicity and reliability across all refactoring operations.