/**
 * @description Inline variable with method call initializer when same variable name exists in different scopes
 * @command refakts inline-variable "[{{CURRENT_FILE}} 12:11-12:17]"
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