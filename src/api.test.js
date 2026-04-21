const handler = require('./api');

describe('handler regression for missing user.profile', () => {
  it('does not throw when profile is undefined and returns an empty uppercase name', () => {
    expect(() => handler({ id: 1 })).not.toThrow();
    expect(handler({ id: 1 })).toBe('');
  });

  it('still returns the uppercased profile name when present', () => {
    expect(handler({ id: 1, profile: { name: 'alice' } })).toBe('ALICE');
  });
});
