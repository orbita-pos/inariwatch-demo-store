const sumArray = require('../__inari_bugs_fixtures__/bug-05-off-by-one');

describe('bug-05-off-by-one regression', () => {
  test('returns the numeric sum for a multi-element array instead of NaN', () => {
    expect(sumArray([1, 2, 3])).toBe(6);
  });

  test('does not read past the end of a single-element array', () => {
    expect(sumArray([5])).toBe(5);
  });
});
