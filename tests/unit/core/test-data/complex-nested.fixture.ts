class OuterClass {
  method() {
    function innerFn() {
      const arrow = () => {
        const deeply = { nested: { variable: 'test' } };
        return deeply.nested.variable;
      };
    }
  }
}