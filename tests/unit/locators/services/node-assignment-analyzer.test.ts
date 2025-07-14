import { NodeAssignmentAnalyzer } from '../../../../src/locators/services/node-assignment-analyzer';
import { Project } from 'ts-morph';
import * as ts from 'typescript';
import { verify } from 'approvals';

describe('NodeAssignmentAnalyzer', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
  });

  function testCompoundAssignmentOperators(operators: string[]) {
    const results: string[] = [];
    
    operators.forEach(op => {
      try {
        const sourceFile = project.createSourceFile(`test-${op}.ts`, `let x; x ${op} 5;`);
        const assignment = sourceFile.getDescendantsOfKind(ts.SyntaxKind.BinaryExpression)[0];
        const identifier = assignment.getLeft();
        
        const result = NodeAssignmentAnalyzer.isUpdateContext(assignment, identifier);
        results.push(`${op}: ${result}`);
      } catch (error) {
        results.push(`${op}: error - ${error instanceof Error ? error.message : 'unknown'}`);
      }
    });
    
    return results;
  }

  function testUndefinedParent(analyzerMethod: (_parent: any, _node: any) => boolean) {
    const sourceFile = project.createSourceFile('test.ts', 'let x;');
    const identifier = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier)[0];
    
    const result = analyzerMethod(undefined, identifier);
    
    expect(result).toBe(false);
  }


  describe('isAssignmentContext', () => {
    it('detects binary assignment context', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x; x = 5;');
      const assignment = sourceFile.getDescendantsOfKind(ts.SyntaxKind.BinaryExpression)[0];
      const identifier = assignment.getLeft();
      
      const result = NodeAssignmentAnalyzer.isAssignmentContext(assignment, identifier);
      
      expect(result).toBe(true);
    });

    it('returns false for non-assignment binary expression', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x = a + b;');
      const addition = sourceFile.getDescendantsOfKind(ts.SyntaxKind.BinaryExpression)[0];
      const identifier = addition.getLeft();
      
      const result = NodeAssignmentAnalyzer.isAssignmentContext(addition, identifier);
      
      expect(result).toBe(false);
    });

    it('returns false when parent is undefined', () => {
      testUndefinedParent(NodeAssignmentAnalyzer.isAssignmentContext);
    });

    it('returns false when node is not left side of assignment', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x; x = y;');
      const assignment = sourceFile.getDescendantsOfKind(ts.SyntaxKind.BinaryExpression)[0];
      const rightSide = assignment.getRight();
      
      const result = NodeAssignmentAnalyzer.isAssignmentContext(assignment, rightSide);
      
      expect(result).toBe(false);
    });
  });

  describe('isUpdateContext', () => {
    it('detects postfix unary update', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x; x++;');
      const postfix = sourceFile.getDescendantsOfKind(ts.SyntaxKind.PostfixUnaryExpression)[0];
      const identifier = postfix.getOperand();
      
      const result = NodeAssignmentAnalyzer.isUpdateContext(postfix, identifier);
      
      expect(result).toBe(true);
    });

    it('detects prefix unary update', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x; ++x;');
      const prefix = sourceFile.getDescendantsOfKind(ts.SyntaxKind.PrefixUnaryExpression)[0];
      const identifier = prefix.getOperand();
      
      const result = NodeAssignmentAnalyzer.isUpdateContext(prefix, identifier);
      
      expect(result).toBe(true);
    });

    it('detects compound assignment operators', () => {
      const results = testCompoundAssignmentOperators(['+=', '-=', '*=', '/=']);
      verify(__dirname, 'compound-assignment-detection', results.join('\n'), { reporters: ['donothing'] });
    });

    it('returns false for non-update contexts', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x; let y = x + 5;');
      const addition = sourceFile.getDescendantsOfKind(ts.SyntaxKind.BinaryExpression)[0];
      const identifier = addition.getLeft();
      
      const result = NodeAssignmentAnalyzer.isUpdateContext(addition, identifier);
      
      expect(result).toBe(false);
    });

    it('returns false when parent is undefined', () => {
      testUndefinedParent(NodeAssignmentAnalyzer.isUpdateContext);
    });
  });

  describe('determineUsageType', () => {
    it('determines usage types for various contexts', () => {
      const testCases = [
        'let x; x = 5;',        // write
        'let x; x += 5;',       // update  
        'let x; x++;',          // update
        'let x; ++x;',          // update
        'let x = 5; let y = x;' // read
      ];
      
      const results: string[] = [];
      
      testCases.forEach((code, index) => {
        const sourceFile = project.createSourceFile(`test-usage-${index}.ts`, code);
        const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
        // Get the identifier that's being used (not declared)
        const usageIdentifier = identifiers[identifiers.length - 1];
        
        const usageType = NodeAssignmentAnalyzer.determineUsageType(usageIdentifier);
        results.push(`${code.split(';').pop()?.trim()}: ${usageType}`);
      });
      
      verify(__dirname, 'usage-type-determination', results.join('\n'), { reporters: ['donothing'] });
    });

    it('handles complex nested expressions', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x; obj.prop = x + (x *= 2);');
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const results: string[] = [];
      
      identifiers.forEach((identifier, index) => {
        if (identifier.getText() === 'x') {
          const usageType = NodeAssignmentAnalyzer.determineUsageType(identifier);
          results.push(`x at position ${index}: ${usageType}`);
        }
      });
      
      verify(__dirname, 'complex-nested-expressions', results.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('edge cases', () => {
    it('handles malformed assignments gracefully', () => {
      // Test with incomplete assignment expressions
      const sourceFile = project.createSourceFile('test.ts', 'let x; x');
      const identifier = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier)[1];
      
      const result = NodeAssignmentAnalyzer.determineUsageType(identifier);
      
      expect(result).toBe('read');
    });

    it('handles various compound assignment operators', () => {
      const results = testCompoundAssignmentOperators(['%=', '**=', '&=', '|=', '^=', '<<=', '>>=', '>>>=']);
      verify(__dirname, 'extended-compound-operators', results.join('\n'), { reporters: ['donothing'] });
    });
  });
});