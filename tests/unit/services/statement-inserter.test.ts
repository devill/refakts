import { Project, SyntaxKind } from 'ts-morph';
import { StatementInserter } from '../../../src/core/transformations/statement-inserter';
import * as fixtures from './statement-scenarios';

describe('StatementInserter', () => {
  let inserter: StatementInserter;
  let project: Project;

  beforeEach(() => {
    inserter = new StatementInserter();
    project = new Project({ useInMemoryFileSystem: true });
  });

  describe('insertVariableDeclaration', () => {
    it('should insert variable declaration before statement in function block', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.functionWithStatements);
      const doubledIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'doubled' && node.getParent()?.getKind() === SyntaxKind.BinaryExpression);
      expect(doubledIdentifier).toBeDefined();
      
      inserter.insertVariableDeclaration(doubledIdentifier!, 'newVar');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const newVar = doubled;');
      expect(updatedCode).toContain('const result = doubled + 10;');
      
      const newVarIndex = updatedCode.indexOf('const newVar = doubled;');
      const resultIndex = updatedCode.indexOf('const result = doubled + 10;');
      expect(newVarIndex).toBeLessThan(resultIndex);
    });

    it('should insert variable declaration in nested block scope', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.blockScope);
      const localVarIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'localVar' && 
               node.getParent()?.getKind() === SyntaxKind.CallExpression);
      expect(localVarIdentifier).toBeDefined();
      
      inserter.insertVariableDeclaration(localVarIdentifier!, 'extracted');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const extracted = localVar;');
      expect(updatedCode).toContain('console.log(localVar);');
    });

    it('should insert variable declaration at module level', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.moduleLevel);
      const configIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'config' && 
               node.getParent()?.getKind() === SyntaxKind.CallExpression);
      
      expect(configIdentifier).toBeDefined();
      
      inserter.insertVariableDeclaration(configIdentifier!, 'configRef');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const configRef = config;');
      expect(updatedCode).toContain('console.log(config);');
    });

    it('should handle deeply nested blocks', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.nestedBlocks);
      const innerIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'inner' && 
               node.getParent()?.getKind() === SyntaxKind.CallExpression);
      expect(innerIdentifier).toBeDefined();
      
      inserter.insertVariableDeclaration(innerIdentifier!, 'innerRef');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const innerRef = inner;');
      expect(updatedCode).toContain('console.log(inner);');
    });

    it('should handle arrow function blocks', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.arrowFunctionBlock);
      const processedIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'processed' && 
               node.getParent()?.getKind() === SyntaxKind.ReturnStatement);
      
      expect(processedIdentifier).toBeDefined();
      
      inserter.insertVariableDeclaration(processedIdentifier!, 'processedRef');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const processedRef = processed;');
      expect(updatedCode).toContain('return processed;');
    });

    it('should handle expression-only statements at module level', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.expressionOnly);
      const identifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)[0];
      
      inserter.insertVariableDeclaration(identifier, 'newVar');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const newVar = a;');
    });
  });

  describe('createDeclarationText', () => {
    it('should create const declaration with expression text', () => {
      const sourceFile = project.createSourceFile('test.ts', 'const x = a + b;');
      const binaryExpression = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression)[0];
      
      const declarationText = inserter.createDeclarationText(binaryExpression, 'result');
      
      expect(declarationText).toBe('const result = a + b;');
    });

    it('should handle complex expressions', () => {
      const sourceFile = project.createSourceFile('test.ts', 'const x = obj.method(arg1, arg2).property;');
      const propertyAccess = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)[0]; // Get the full .property access
      
      const declarationText = inserter.createDeclarationText(propertyAccess, 'extracted');
      
      expect(declarationText).toBe('const extracted = obj.method(arg1, arg2).property;');
    });

    it('should handle function calls', () => {
      const sourceFile = project.createSourceFile('test.ts', 'const x = calculateValue(input);');
      const callExpression = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)[0];
      
      const declarationText = inserter.createDeclarationText(callExpression, 'calculated');
      
      expect(declarationText).toBe('const calculated = calculateValue(input);');
    });

    it('should handle string literals', () => {
      const sourceFile = project.createSourceFile('test.ts', 'const x = "hello world";');
      const stringLiteral = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral)[0];
      
      const declarationText = inserter.createDeclarationText(stringLiteral, 'message');
      
      expect(declarationText).toBe('const message = "hello world";');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle insertion at the beginning of a block', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function test() {
          const first = 1;
          const second = 2;
        }
      `);
      const firstIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'first' && 
               node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(firstIdentifier).toBeDefined();
      
      inserter.insertVariableDeclaration(firstIdentifier!, 'beforeFirst');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const beforeFirst = first;');
      
      const beforeFirstIndex = updatedCode.indexOf('const beforeFirst = first;');
      const firstIndex = updatedCode.indexOf('const first = 1;');
      expect(beforeFirstIndex).toBeLessThan(firstIndex);
    });

    it('should handle insertion at the end of a block', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function test() {
          const first = 1;
          return first;
        }
      `);
      const returnIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'first' && 
               node.getParent()?.getKind() === SyntaxKind.ReturnStatement);
      
      expect(returnIdentifier).toBeDefined();
      
      inserter.insertVariableDeclaration(returnIdentifier!, 'beforeReturn');
      
      const updatedCode = sourceFile.getFullText();
      expect(updatedCode).toContain('const beforeReturn = first;');
      expect(updatedCode).toContain('return first;');
    });

    it('should test error condition with orphaned node', () => {
      project.createSourceFile('test.ts', 'const x = 1;');
      
      const mockNode = {
        getText: () => 'mockNode',
        getParent: () => undefined
      } as any;
      
      expect(() => {
        inserter.insertVariableDeclaration(mockNode, 'extracted');
      }).toThrow('Cannot find containing statement for variable declaration');
    });
  });
});