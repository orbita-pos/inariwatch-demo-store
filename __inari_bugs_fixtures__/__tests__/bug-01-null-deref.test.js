const getUserName = require('../bug-01-null-deref');

describe('bug-01-null-deref regression', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns empty string instead of throwing when user is undefined', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => getUserName(undefined)).not.toThrow();
    expect(getUserName(undefined)).toBe('');
    expect(errorSpy).toHaveBeenCalledWith('Invalid user object provided');
  });

  test('returns empty string instead of throwing when profile is missing', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => getUserName({})).not.toThrow();
    expect(getUserName({})).toBe('');
    expect(errorSpy).toHaveBeenCalledWith('Invalid user object provided');
  });
});
