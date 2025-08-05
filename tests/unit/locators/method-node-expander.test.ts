import { describe, expect, it } from '@jest/globals';
import { Project, SourceFile } from 'ts-morph';
import { MethodNodeExpander } from '../../../src/core/locators/method-node-expander';

describe('MethodNodeExpander', () => {
  let project: Project;
  let expander: MethodNodeExpander;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
    expander = new MethodNodeExpander();
  });

  function testNodeExpansion(code: string, nodeSelector: (sourceFile: SourceFile) => any, expectedText: string): void {
    const sourceFile = project.createSourceFile('test.ts', code);
    expect(expander.expandWithMetadata(nodeSelector(sourceFile), sourceFile).getFullText().trim()).toBe(expectedText);
  }

  describe('Node Expansion', () => {
    it('should expand method with JSDoc', () => {
      testNodeExpansion(
        `class TestClass {
  /**
   * This is a JSDoc comment
   */
  testMethod() {
    return 'test';
  }
}`,
        (sf) => sf.getClassOrThrow('TestClass').getMethodOrThrow('testMethod'),
        `/**
   * This is a JSDoc comment
   */
  testMethod() {
    return 'test';
  }`
      );
    });

    it('should expand method with decorator', () => {
      testNodeExpansion(
        `class TestClass {
  @deprecated
  testMethod() {
    return 'test';
  }
}`,
        (sf) => sf.getClassOrThrow('TestClass').getMethodOrThrow('testMethod'),
        `@deprecated
  testMethod() {
    return 'test';
  }`
      );
    });

    it('should expand method with single-line comment', () => {
      testNodeExpansion(
        `class TestClass {
  // This is a single-line comment
  testMethod() {
    return 'test';
  }
}`,
        (sf) => sf.getClassOrThrow('TestClass').getMethodOrThrow('testMethod'),
        `// This is a single-line comment
  testMethod() {
    return 'test';
  }`
      );
    });

    it('should expand constructor with metadata', () => {
      testNodeExpansion(
        `class TestClass {
  /**
   * Constructor documentation
   */
  constructor() {
    // Constructor body
  }
}`,
        (sf) => sf.getClassOrThrow('TestClass').getConstructors()[0],
        `/**
   * Constructor documentation
   */
  constructor() {
    // Constructor body
  }`
      );
    });

    it('should expand method with combined metadata', () => {
      testNodeExpansion(
        `class TestClass {
  /**
   * JSDoc comment
   */
  @deprecated
  @injectable
  complexMethod(): void {
    console.log('test');
  }
}`,
        (sf) => sf.getClassOrThrow('TestClass').getMethodOrThrow('complexMethod'),
        `/**
   * JSDoc comment
   */
  @deprecated
  @injectable
  complexMethod(): void {
    console.log('test');
  }`
      );
    });


    it('should expand class property with JSDoc', () => {
      testNodeExpansion(
        `class TestClass {
  /**
   * A class property with JSDoc
   */
  private value: string = 'default';
}`,
        (sf) => sf.getClassOrThrow('TestClass').getProperties()[0] as any,
        `/**
   * A class property with JSDoc
   */
  private value: string = 'default';`
      );
    });

    it('should expand arrow function property with JSDoc', () => {
      testNodeExpansion(
        `class TestClass {
  /**
   * Arrow function method with JSDoc
   * @param input - The input parameter
   */
  arrowMethod = (input: string): string => {
    return input.toUpperCase();
  };
}`,
        (sf) => sf.getClassOrThrow('TestClass').getProperties()[0] as any,
        `/**
   * Arrow function method with JSDoc
   * @param input - The input parameter
   */
  arrowMethod = (input: string): string => {
    return input.toUpperCase();
  };`
      );
    });

    it('should expand standalone variable with JSDoc', () => {
      testNodeExpansion(
        `/**
 * A standalone variable with JSDoc
 * @type {string}
 */
const globalVariable = 'hello world';

class TestClass {}`,
        (sf) => sf.getVariableStatements()[0] as any,
        `/**
 * A standalone variable with JSDoc
 * @type {string}
 */
const globalVariable = 'hello world';`
      );
    });
  });
});