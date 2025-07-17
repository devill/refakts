class OuterClass {
  method() {
    function innerFn() {
      const arrow = () => {
        let deeply = { nested: { variable: 'test' } };
        return deeply.nested.variable;
      };
    }
  }
}