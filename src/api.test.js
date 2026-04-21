const handler = require('./api');

describe('handler regression: missing profile', () => {
  test('returns an empty string instead of throwing when user.profile is undefined', () => {
    expect(() => handler({ id: 1 })).not.toThrow();
    expect(handler({ id: 1 })).toBe('');
  });

  test('still returns the uppercased profile name when present', () => {
    expect(handler({ id: 1, profile: { name: 'alice' } })).toBe('ALICE');
  });
});
