import { NodeContext } from '../../../src/core/node-context';
import { PositionData } from '../../../src/core/position-data';
import * as ts from 'typescript';
import { setupProject } from './node-context-setup';

describe('NodeContext - Basic Operations', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('constructor and basic properties', () => {
    it('creates context with node, source file, and position', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const position = PositionData.fromNodePosition(sourceFile, variable.getStart());
      
      const context = new NodeContext(variable, sourceFile, position);
      
      expect(context.node).toBe(variable);
      expect(context.sourceFile).toBe(sourceFile);
      expect(context.position).toBe(position);
    });
  });

  describe('create static method', () => {
    it('creates context from node and source file', () => {
      const sourceFile = project.createSourceFile('test1.ts', 'let myVar = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const context = NodeContext.create(variable, sourceFile);
      
      expect(context.node).toBe(variable);
      expect(context.sourceFile).toBe(sourceFile);
      expect(context.position).toBeDefined();
    });

    it('correctly calculates position from node start', () => {
      const sourceFile = project.createSourceFile('test2.ts', `
        function fn() {
          let variable = 10;
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const context = NodeContext.create(variable, sourceFile);
      
      const expectedPosition = PositionData.fromNodePosition(sourceFile, variable.getStart());
      expect(context.position.line).toBe(expectedPosition.line);
      expect(context.position.column).toBe(expectedPosition.column);
    });
  });

  describe('isIdentifier', () => {
    it('detects identifier nodes correctly', () => {
      const sourceFile = project.createSourceFile('test8.ts', 'let myVariable = 5;');
      const identifier = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier)[0];
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const identifierContext = NodeContext.create(identifier, sourceFile);
      const variableContext = NodeContext.create(variable, sourceFile);
      
      expect(identifierContext.isIdentifier()).toBe(true);
      expect(variableContext.isIdentifier()).toBe(false);
    });
  });
});