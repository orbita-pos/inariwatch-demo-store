const getUserName = require('./bug-01-null-deref');

describe('getUserName regression', () => {
  test('returns Unknown when user.profile is undefined', () => {
    expect(getUserName({ id: 1 })).toBe('Unknown');
  });

  test('still returns uppercased profile name when profile exists', () => {
    expect(getUserName({ id: 1, profile: { name: 'alice' } })).toBe('ALICE');
  });
});
