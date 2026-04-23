const getUserName = require('./bug-01-null-deref');

describe('getUserName regression for missing profile', () => {
  test('returns an empty string when user.profile is undefined instead of throwing', () => {
    expect(() => getUserName({ id: 1 })).not.toThrow();
    expect(getUserName({ id: 1 })).toBe('');
  });

  test('still uppercases the profile name when present', () => {
    expect(getUserName({ id: 1, profile: { name: 'alice' } })).toBe('ALICE');
  });
});
