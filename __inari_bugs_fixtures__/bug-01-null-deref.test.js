const getUserName = require('./bug-01-null-deref');

describe('getUserName regression', () => {
  test('returns an empty string when user.profile is undefined', () => {
    expect(getUserName({ id: 1 })).toBe('');
  });

  test('returns the uppercased profile name when present', () => {
    expect(getUserName({ id: 1, profile: { name: 'Alice' } })).toBe('ALICE');
  });
});
