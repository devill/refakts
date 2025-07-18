class MyClass {
  private field = 5;
  
  method() {
    const arrow = () => {
      const local = 'test';
      return local;
    };
  }
}

function globalFn() {
  return 42;
}