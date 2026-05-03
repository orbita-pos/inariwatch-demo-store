const average = require('./bug-04-div-zero');

describe('bug-04-div-zero regression', () => {
  test('returns 0 for an empty array instead of dividing by zero', () => {
    expect(average([])).toBe(0);
  });

  test('still computes the average normally for non-empty arrays', () => {
    expect(average([2, 4, 6])).toBe(4);
  });
});
