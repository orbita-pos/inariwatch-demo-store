const sumArray = require('../__inari_bugs_fixtures__/bug-05-off-by-one');

describe('bug-05-off-by-one regression', () => {
  test('returns the numeric sum for a normal array instead of NaN from reading past the end', () => {
    expect(sumArray([1, 2, 3, 4])).toBe(10);
  });

  test('does not read arr[arr.length] when summing a single-element array', () => {
    expect(sumArray([7])).toBe(7);
  });
});
