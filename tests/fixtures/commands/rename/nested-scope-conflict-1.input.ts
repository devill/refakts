/**
 * @description Renaming x to y should cause a name conflict with inner y
 * @command refakts rename "[nested-scope-conflict-1.input.ts 7:9-7:10]" --to "y"
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
