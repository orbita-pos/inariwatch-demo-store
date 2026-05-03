const sumArray = require('../__inari_bugs_fixtures__/bug-05-off-by-one');

describe('bug-05-off-by-one regression', () => {
  test('sums all elements without reading past the end of the array', () => {
    const arr = [1, 2, 3];

    Object.defineProperty(arr, 3, {
      get() {
        throw new Error('out-of-bounds access');
      },
      configurable: true,
    });

    expect(sumArray(arr)).toBe(6);
  });

  test('includes the last valid element exactly once', () => {
    expect(sumArray([4, 5, 6])).toBe(15);
  });
});
