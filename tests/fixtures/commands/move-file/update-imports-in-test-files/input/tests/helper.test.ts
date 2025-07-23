import { calculateSum, formatMessage } from '../src/utils/helper';

describe('Helper functions', () => {
  test('calculateSum should add two numbers', () => {
    expect(calculateSum(2, 3)).toBe(5);
  });

  test('formatMessage should format message with prefix', () => {
    expect(formatMessage('test')).toBe('[INFO] test');
  });
});