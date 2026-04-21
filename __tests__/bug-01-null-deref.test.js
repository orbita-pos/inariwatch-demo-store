const getUserName = require('../__inari_bugs_fixtures__/bug-01-null-deref');

describe('bug-01 null dereference regression', () => {
  test('returns empty string when user.profile is undefined instead of throwing', () => {
    expect(() => getUserName({ id: 1 })).not.toThrow();
    expect(getUserName({ id: 1 })).toBe('');
  });

  test('still returns the uppercased profile name when present', () => {
    expect(getUserName({ id: 1, profile: { name: 'alice' } })).toBe('ALICE');
  });
});
