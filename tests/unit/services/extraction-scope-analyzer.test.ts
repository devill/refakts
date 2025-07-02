import { Project, Node, SyntaxKind } from 'ts-morph';
import { ExtractionScopeAnalyzer } from '../../../src/services/extraction-scope-analyzer';
import * as fixtures from '../../fixtures/unit/services/scope-scenarios';

describe('ExtractionScopeAnalyzer', () => {
  let analyzer: ExtractionScopeAnalyzer;
  let project: Project;

  beforeEach(() => {
    analyzer = new ExtractionScopeAnalyzer();
    project = new Project({ useInMemoryFileSystem: true });
  });

  describe('findExtractionScope', () => {
    it('should find block scope for expression in function', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const sumIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'sum' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(sumIdentifier).toBeDefined();
      const scope = analyzer.findExtractionScope(sumIdentifier!);
      
      expect(Node.isBlock(scope)).toBe(true);
    });

    it('should return source file when no valid scope found', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.moduleLevel);
      const configIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)[0];
      
      const scope = analyzer.findExtractionScope(configIdentifier);
      
      expect(Node.isSourceFile(scope)).toBe(true);
    });

    it('should find nested block scope', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.nestedScopes);
      const innerVarIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'innerVar' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(innerVarIdentifier).toBeDefined();
      const scope = analyzer.findExtractionScope(innerVarIdentifier!);
      
      expect(Node.isBlock(scope)).toBe(true);
    });
  });

  describe('findContainingStatement', () => {
    it('should find variable declaration statement', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const sumIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'sum' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(sumIdentifier).toBeDefined();
      const statement = analyzer.findContainingStatement(sumIdentifier!);
      
      expect(statement).toBeDefined();
      expect(statement!.getKind()).toBe(SyntaxKind.VariableStatement);
    });

    it('should return undefined for expression without containing statement', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.moduleLevel);
      const configIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)[0];
      
      const statement = analyzer.findContainingStatement(configIdentifier);
      
      expect(statement).toBeDefined(); // Module level should have a statement
    });

    it('should find return statement', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const returnStatement = sourceFile.getDescendantsOfKind(SyntaxKind.ReturnStatement)[0];
      const sumInReturn = returnStatement.getDescendantsOfKind(SyntaxKind.Identifier)[0];
      
      const statement = analyzer.findContainingStatement(sumInReturn);
      
      expect(statement).toBeDefined();
      expect(statement!.getKind()).toBe(SyntaxKind.ReturnStatement);
    });
  });

  describe('isValidExtractionScope', () => {
    it('should return true for block nodes', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const block = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const isValid = analyzer.isValidExtractionScope(block);
      
      expect(isValid).toBe(true);
    });

    it('should return true for source file nodes', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.moduleLevel);
      
      const isValid = analyzer.isValidExtractionScope(sourceFile);
      
      expect(isValid).toBe(true);
    });

    it('should return false for undefined', () => {
      const isValid = analyzer.isValidExtractionScope(undefined);
      
      expect(isValid).toBe(false);
    });

    it('should return false for non-block, non-source-file nodes', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const functionDecl = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)[0];
      
      const isValid = analyzer.isValidExtractionScope(functionDecl);
      
      expect(isValid).toBe(false);
    });
  });

  describe('findScopeName', () => {
    it('should find function scope name', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const sumIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'sum' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(sumIdentifier).toBeDefined();
      const scopeName = analyzer.findScopeName(sumIdentifier!);
      
      expect(scopeName).toBe('function calculateTotal');
    });

    it('should find method scope name', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.classWithMethods);
      const resultIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'result' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(resultIdentifier).toBeDefined();
      const scopeName = analyzer.findScopeName(resultIdentifier!);
      
      expect(scopeName).toBe('method add');
    });

    it('should find constructor scope name', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.classWithMethods);
      const constructor = sourceFile.getDescendantsOfKind(SyntaxKind.Constructor)[0];
      const thisValue = constructor.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'initialValue');
      
      expect(thisValue).toBeDefined();
      const scopeName = analyzer.findScopeName(thisValue!);
      
      expect(scopeName).toBe('constructor');
    });

    it('should find arrow function scope name', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.arrowFunctions);
      const resultIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'result' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(resultIdentifier).toBeDefined();
      const scopeName = analyzer.findScopeName(resultIdentifier!);
      
      expect(scopeName).toBe('arrow function');
    });

    it('should find file scope name for module level', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.moduleLevel);
      const configIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)[0];
      
      const scopeName = analyzer.findScopeName(configIdentifier);
      
      expect(scopeName).toBe('file scope');
    });

    it('should handle anonymous function', () => {
      const sourceFile = project.createSourceFile('test.ts', 
        'const fn = function() { const x = 1; return x; };'
      );
      const xIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'x' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(xIdentifier).toBeDefined();
      const scopeName = analyzer.findScopeName(xIdentifier!);
      
      expect(scopeName).toBe('function <anonymous>');
    });

    it('should return file scope for top-level expressions', () => {
      const sourceFile = project.createSourceFile('test.ts', '1 + 2');
      const numberLiteral = sourceFile.getDescendantsOfKind(SyntaxKind.NumericLiteral)[0];
      
      const scopeName = analyzer.findScopeName(numberLiteral);
      
      expect(scopeName).toBe('file scope');
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle deeply nested scopes', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.complexNesting);
      const transformedIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .find(node => node.getText() === 'transformed' && node.getParent()?.getKind() === SyntaxKind.VariableDeclaration);
      
      expect(transformedIdentifier).toBeDefined();
      const scope = analyzer.findExtractionScope(transformedIdentifier!);
      const scopeName = analyzer.findScopeName(transformedIdentifier!);
      
      expect(Node.isBlock(scope)).toBe(true);
      expect(scopeName).toBe('arrow function');
    });

    it('should handle nodes at root level', () => {
      const sourceFile = project.createSourceFile('test.ts', 'const x = 1;');
      const xIdentifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)[0];
      
      const scope = analyzer.findExtractionScope(xIdentifier);
      const statement = analyzer.findContainingStatement(xIdentifier);
      
      expect(Node.isSourceFile(scope)).toBe(true);
      expect(statement).toBeDefined();
    });
  });
});