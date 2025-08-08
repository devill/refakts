/**
 * @description Renaming y to x should cause a name conflict with outer x
 * @command refakts rename "[nested-scope-conflict-2.input.ts 9:9-9:10]" --to "x"
 */

function f() {
  const x = 1;
  {
    const y = 2;
    {
      return x;
    }
  }
}

expect(f()).toBe(1);
