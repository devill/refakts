# RefakTS Project Brief

I'd like to create a command line typescript refactoring tool based on ts-morph and tsquery. 

## Purpose

Provide a tool for AI coding agents to perform actions using a single command that
would otherwise involve a complete regeneration of the code. (Also affectionately 
known as a shotgun surgery.)

## Command line format:

This is a proposal, but since you are a coding agent yourself you might be able to
tell better what would be a convenient format for you.

Simple inline variable refactoring specified by line:column
```bash
refakts inline-variable src/input.ts --line 8 --column 10
```

Simple inline variable refactoring specified by tsquery
```bash
refakts inline-variable src/input.ts --query 'Identifier[name="Animal"]'
```

## Testing

There will be a single integration test that uses a dataprovider to load multiple scenarios
from a tree structure:

```
📁 tests/
├── 📁 fixtures/
│   ├── 📁 inline-variable/
│   │   ├── simple-case.input.ts
│   │   ├── simple-case.expected.ts
│   │   ├── simple-case.received.ts           
│   │   ├── inline-only-within-scope.input.ts
│   │   ├── inline-only-within-scope.expected.ts
│   │   ├── shadowed-variable.input.ts
│   │   ├── shadowed-variable.expected.ts
│   │   └── ...
│   │
│   ├── 📁 rename-variable/
│   │   ├── simple-case.input.ts
│   │   ├── simple-case.expected.ts
│   │   ├── conflicting-scope.input.ts
│   │   ├── conflicting-scope.expected.ts
│   │   ├── conflicting-scope.received.ts
│   │   └── ... 
│   │
│   ├── 📁 extract-method/
│   │   ├── happy-path.input.ts
│   │   ├── happy-path.expected.ts
│   │   └── happy-path.received.ts
│   │   └── ...
│   │
│   ├── 📁 move-method/
│   │   ├── 📁 move-static-simple-case/
│   │   │   ├── meta.yaml
│   │   │   ├── from-class.input.ts
│   │   │   ├── from-class.expected.ts
│   │   │   ├── from-class.received.ts
│   │   │   ├── to-class.input.ts
│   │   │   ├── to-class.expected.ts
│   │   │   └── to-class.received.ts
│   │   └── ...
│   └── ...
└── 📁 integration/
    └── refactoring.test.ts
```

The file pattern `*.received.ts` should be included in `.gitignore` since these should only 
appear when the respective test is failing.

More complex test cases that require multiple source files (like for instance move-method)
will get their own subfolder 

### Test file format

For single file test data, the file should include a header that specifies the test 
description and the command that triggers the refactoring performed. Each of them 
should be a valid ts file.

```ts
/**
 * @description Inline a single variable
 * @command refakts inline-variable example.input.ts --line 8 --column 10
 */
```

A test case may contain multiple consecutive commands. 
```ts
/**
 * @description Inline multiple variables
 * @command refakts inline-variable example.input.ts --line 8 --column 10
 * @command refakts inline-variable example.input.ts --line 15 --column 10
 */
...
```

For multiple file test cases a meta.yaml file is included that contains the same info 
as the header in the single file case. 

```yaml
description: Inline multiple variables
commands:
  - refakts inline-variable example.input.ts --line 8 --column 10
  - refakts inline-variable example.input.ts --line 15 --column 10
```

## Tasks

- Set up a basic project structure for us with approval testing.
- Install necessary packages including 