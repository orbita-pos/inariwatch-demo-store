const sumArray = require('../__inari_bugs_fixtures__/bug-05-off-by-one');

describe('bug-05-off-by-one regression', () => {
  test('sums all elements without reading past the end of the array', () => {
    expect(sumArray([1, 2, 3])).toBe(6);
  });

  test('does not produce NaN for a single-element array', () => {
    expect(sumArray([5])).toBe(5);
  });
});
