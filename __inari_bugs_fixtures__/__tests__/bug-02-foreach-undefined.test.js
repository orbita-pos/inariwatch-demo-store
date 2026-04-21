const sumItems = require('../bug-02-foreach-undefined');

describe('bug-02-foreach-undefined regression', () => {
  test('returns 0 when called with undefined data', () => {
    expect(() => sumItems(undefined)).not.toThrow();
    expect(sumItems(undefined)).toBe(0);
  });

  test('still sums item values for defined arrays', () => {
    expect(sumItems([{ value: 2 }, { value: 3 }])).toBe(5);
  });
});
