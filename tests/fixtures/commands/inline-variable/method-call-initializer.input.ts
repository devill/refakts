/**
 * @description Inline variable with method call initializer when same variable name exists in different scopes
 * @command refakts inline-variable "[method-call-initializer.input.ts 12:11-12:17]"
 */
class TestClass {
  method1() {
    const matches = this.executeQuery(sourceFile, query);
    return matches[0];
  }

  method2() {
    const matches = this.executeQuery(sourceFile, query);
    return matches.map(match => this.convertToMorphNode(sourceFile, match));
  }
}