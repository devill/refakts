/**
 * @description Inline variable with method call initializer when same variable name exists in different scopes
 * @command refakts inline-variable "[method-call-initializer.input.ts 11:9-11:15]"
 */
class TestClass {
  method1() {
    const matches = this.executeQuery(sourceFile, query);
    return matches[0];
  }

  method2() {
    return this.executeQuery(sourceFile, query).map(match => this.convertToMorphNode(sourceFile, match));
  }
}