const average = require('./bug-04-div-zero');

describe('bug-04-div-zero regression', () => {
  test('returns 0 for empty input instead of Infinity', () => {
    expect(average([])).toBe(0);
  });

  test('still returns the arithmetic mean for non-empty input', () => {
    expect(average([2, 4, 6])).toBe(4);
  });
});
