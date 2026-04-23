const processItems = require('../bug-02-foreach-undefined');

describe('bug-02-foreach-undefined regression', () => {
  test('returns 0 when called with undefined instead of throwing', () => {
    expect(processItems(undefined)).toBe(0);
  });

  test('returns 0 for non-array input instead of attempting forEach', () => {
    expect(processItems(null)).toBe(0);
  });

  test('still sums item values for valid arrays', () => {
    expect(processItems([{ value: 2 }, { value: 3 }])).toBe(5);
  });
});
