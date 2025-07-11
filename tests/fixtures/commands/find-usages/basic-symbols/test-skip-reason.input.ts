/**
 * @description Test skip reason functionality for single-file tests
 * @command find-usages '[test-skip-reason.input.ts 7:17-7:25]'
 * @skip "Testing skip reason support - implementation not ready"
 */

export function testFunc(): void {
  console.log('test');
}